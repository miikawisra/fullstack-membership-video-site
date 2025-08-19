from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status, APIRouter
import shutil
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models import UserCreate, UserLogin, Token, User, Video, VideoBase
from auth import hash_password, verify_password, create_jwt
from database import SessionLocal, Base, engine, get_db
from fastapi import Form, Header
from dotenv import load_dotenv
import os
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from fastapi.staticfiles import StaticFiles
from typing import List
import stripe
from fastapi import Request

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
router = APIRouter()

load_dotenv()  # lataa .env-tiedoston arvot ympäristömuuttujiin

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
# OAuth2 tunnistusmekanismi, tokenin vastaanotto headerista
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

app = FastAPI()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Virheellinen tunnistus",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/create-checkout-session")
async def create_checkout_session(current_user: User = Depends(get_current_user)):
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': os.getenv("STRIPE_PRICE_ID"),  # luodun 1€ tuotteen price_id
                'quantity': 1,
            }],
            mode='payment',
            success_url="http://localhost:3000/success",
            cancel_url="http://localhost:3000/cancel",
            metadata={"user_id": current_user.id}
        )
        return {"id": checkout_session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Webhook vastaanottaa tiedon kun maksu onnistuu
@app.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata']['user_id']

        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_premium = True
            db.commit()

    return {"status": "success"}



router = APIRouter()

load_dotenv()  # lataa .env-tiedoston arvot ympäristömuuttujiin

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
# OAuth2 tunnistusmekanismi, tokenin vastaanotto headerista
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")



# Luo taulut tietokantaan, jos niitä ei ole
Base.metadata.create_all(bind=engine)



origins = [
    "http://localhost:3000",  # frontendin osoite
    "http://127.0.0.1:3000",
]

# Palvele videotiedostot staattisina tiedostoina
app.mount("/videos", StaticFiles(directory="videos"), name="videos")

# CORS – salli frontin kutsut
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # React frontendin osoite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/videos")
async def upload_video(
    title: str = Form(...),
    is_premium: bool = Form(False),
    video: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_location = f"videos/{video.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    db_video = Video(title=title, filename=video.filename, user_id=current_user.id, is_premium=is_premium)
    db.add(db_video)
    db.commit()
    db.refresh(db_video)

    return {"msg": "OK"}

VIDEO_DIR = "videos"

@app.get("/api/videos")
async def get_videos(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = None
    if authorization:
        try:
            token = authorization.split(" ")[1]  # "Bearer <token>"
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            if email:
                user = db.query(User).filter(User.email == email).first()
        except Exception:
            pass  # Jos token ei kelpaa, user jää None

    db_videos = db.query(Video).all()  # Palautetaan kaikki videot ilman suodatusta

    videos = [{
        "id": video.id,
        "title": video.title,
        "filename": video.filename,
        "is_premium": video.is_premium
    } for video in db_videos]

    return videos



# Tietokantayhteys pyynnöille
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Rekisteröi käyttäjä
@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Sähköposti on jo käytössä")

    hashed_pw = hash_password(user.password)
    new_user = User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_jwt(new_user.email, new_user.is_premium)
    return {"msg": "Käyttäjä luotu onnistuneesti", "access_token": token}


# Kirjaudu sisään
@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    print("Löytyikö käyttäjä:", db_user)

    if not db_user:
        print("Käyttäjää ei löytynyt")
        raise HTTPException(status_code=401, detail="Virheellinen sähköposti tai salasana")

    print("Annettu salasana:", user.password)
    print("Tallennettu hash:", db_user.hashed_password)
    valid = verify_password(user.password, db_user.hashed_password)
    print("Täsmääkö salasana:", valid)

    if not valid:
        print("Salasana ei täsmää")
        raise HTTPException(status_code=401, detail="Virheellinen sähköposti tai salasana")

    token = create_jwt(db_user.email, db_user.is_premium)
    return {"access_token": token}


