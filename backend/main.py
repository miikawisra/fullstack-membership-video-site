from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models import UserCreate, UserLogin, Token, User
from auth import hash_password, verify_password, create_jwt
from database import SessionLocal, Base, engine

# Luo taulut tietokantaan, jos niitä ei ole
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS – salli frontin kutsut
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontendin osoite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    try:
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Sähköposti on jo käytössä")

        hashed_pw = hash_password(user.password)
        new_user = User(email=user.email, hashed_password=hashed_pw)

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {"msg": "Käyttäjä luotu onnistuneesti"}
    except Exception as e:
        print("Virhe rekisteröinnissä:", e)
        raise HTTPException(status_code=500, detail="Sisäinen palvelinvirhe")



# Kirjaudu sisään
@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Virheellinen sähköposti tai salasana")

    if not verify_password(user.password, db_user.hashed_password):

        raise HTTPException(status_code=401, detail="Virheellinen sähköposti tai salasana")

    token = create_jwt(db_user.email, db_user.is_premium)
    return {"access_token": token}
