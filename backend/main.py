from database import engine, Sale
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from sqlalchemy.orm import Session
from database import SessionLocal
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, ValidationError
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SaleCreate(BaseModel):
    product_id: int = Field(..., gt=0, description="Product ID must be positive")
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0")
    sale_date: date
    customer_name: str = Field(..., min_length=1, max_length=100, description="Customer name is required")
    remarks: Optional[str] = Field(None, max_length=255)

    
    @field_validator('sale_date')
    @classmethod
    def sale_date_not_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError('Sale date cannot be in the future')
        return v

class SaleResponse(BaseModel):
    sale_id: int
    product_id: int
    quantity: int
    amount: float
    sale_date: date
    customer_name: str
    remarks: Optional[str] = None
    created_at: datetime

app = FastAPI(title="Sales Management API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.get("/sales", response_model=list[SaleResponse])
def get_all_sales():
    db = SessionLocal()
    try:
        sales = db.query(Sale).order_by(Sale.created_at.desc()).all()
        return sales
    finally:
        db.close()
        
@app.get("/sales/{sale_id}", response_model=SaleResponse)
def get_sale_by_id(sale_id: int):
    db = SessionLocal()
    try:
        sale = db.query(Sale).filter(Sale.sale_id == sale_id).first()
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        return sale
    finally:
        db.close()

@app.post("/sales", response_model=SaleResponse)
def create_sale(sale: SaleCreate):
    db = SessionLocal()
    try:
        logger.info(f"Creating sale: product_id={sale.product_id}, quantity={sale.quantity}, customer={sale.customer_name}")
        result = db.execute(
            text("SELECT unit_price FROM products WHERE product_id = :product_id"),
            {"product_id": sale.product_id}
        ).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Product not found")

        unit_price = result[0]
        amount = unit_price * sale.quantity

        
        new_sale = Sale(
            product_id=sale.product_id,
            quantity=sale.quantity,
            amount=amount,
            sale_date=sale.sale_date,
            customer_name=sale.customer_name,
            remarks=sale.remarks
        )
        db.add(new_sale)
        db.commit()
        db.refresh(new_sale)
        return new_sale
    finally:
        db.close()

@app.put("/sales/{sale_id}", response_model=SaleResponse)
def update_sale(sale_id: int, sale_update: SaleCreate):
    db = SessionLocal()
    try:
        
        existing = db.query(Sale).filter(Sale.sale_id == sale_id).first()
        if not existing:
            raise HTTPException(status_code=404, detail="Sale not found")

        
        if sale_update.product_id != existing.product_id or sale_update.quantity != existing.quantity:
            result = db.execute(
                text("SELECT unit_price FROM products WHERE product_id = :product_id"),
                {"product_id": sale_update.product_id}
            ).fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Product not found")
            unit_price = result[0]
            amount = unit_price * sale_update.quantity
        else:
            amount = existing.amount

       
        existing.product_id = sale_update.product_id
        existing.quantity = sale_update.quantity
        existing.amount = amount
        existing.sale_date = sale_update.sale_date
        existing.customer_name = sale_update.customer_name
        existing.remarks = sale_update.remarks

        db.commit()
        db.refresh(existing)
        return existing
    finally:
        db.close()
        
@app.delete("/sales/{sale_id}")
def delete_sale(sale_id: int):
    db = SessionLocal()
    try:
        sale = db.query(Sale).filter(Sale.sale_id == sale_id).first()
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        db.delete(sale)
        db.commit()
        return {"message": f"Sale {sale_id} deleted successfully"}
    finally:
        db.close()
        
@app.get("/products")
def get_products():
    db = SessionLocal()
    try:
        
        result = db.execute(
            text("SELECT product_id, product_name, product_type_id FROM products")
        ).fetchall()
        products = [
            {"product_id": row[0], "product_name": row[1], "product_type_id": row[2]}
            for row in result
        ]
        return products
    finally:
        db.close()