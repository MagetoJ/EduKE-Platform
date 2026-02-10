"""
Safe auto-seeding system for demo data.

This module provides idempotent seeding that:
- Only runs if database is empty (no customer data)
- Uses current multi-tenant schema
- Can be controlled via environment variable
- Safe to run multiple times (won't overwrite existing data)
"""
import logging
import os
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models import Tenant, Category, Unit, Product, User, UserRole, tenant_users
from auth import get_password_hash

logger = logging.getLogger(__name__)


async def is_database_empty(db: AsyncSession) -> bool:
    """
    Check if database is empty (safe to seed demo data).
    
    Returns True only if:
    - No tenants exist (except potentially the demo tenant created at startup)
    - No sales exist
    - No products exist (beyond demo tenant)
    """
    # Count total tenants
    result = await db.execute(select(func.count(Tenant.id)))
    tenant_count = result.scalar() or 0
    
    # If more than 1 tenant exists, customer data is present
    if tenant_count > 1:
        return False
    
    # If 1 tenant, check if it's just the demo tenant
    if tenant_count == 1:
        from models import Sale, Product
        
        # Check for any sales
        result = await db.execute(select(func.count(Sale.id)))
        sales_count = result.scalar() or 0
        if sales_count > 0:
            return False  # Customer has sales data
        
        # Check for any products
        result = await db.execute(select(func.count(Product.id)))
        product_count = result.scalar() or 0
        if product_count > 0:
            return False  # Customer has product data
    
    # Database is empty - safe to seed
    return True


async def seed_demo_tenant_data(db: AsyncSession, tenant: Tenant, admin_user: User):
    """
    Seed demo data for a specific tenant.
    Safe to run multiple times - checks for existing data.
    
    Args:
        db: Database session
        tenant: Tenant to seed data for
        admin_user: Admin user for the tenant
    """
    logger.info(f"🌱 Seeding demo data for tenant: {tenant.name}")
    
    # Check if tenant already has data
    result = await db.execute(
        select(func.count(Product.id)).where(Product.tenant_id == tenant.id)
    )
    existing_products = result.scalar() or 0
    
    if existing_products > 0:
        logger.info(f"✓ Tenant already has {existing_products} products - skipping seed")
        return
    
    # 1. Create Categories
    categories_data = [
        {"name": "Academics", "icon": "book-open", "color": "blue-500", "display_order": 1},
        {"name": "Uniforms", "icon": "shirt", "color": "orange-500", "display_order": 2},
        {"name": "Extra-Curricular", "icon": "music", "color": "purple-500", "display_order": 3},
        {"name": "Stationery", "icon": "pen-tool", "color": "green-500", "display_order": 4},
        {"name": "Boarding", "icon": "home", "color": "pink-500", "display_order": 5},
    ]
    
    categories = {}
    for cat_data in categories_data:
        # Check if category exists
        result = await db.execute(
            select(Category).where(
                Category.name == cat_data["name"]
            )
        )
        existing_cat = result.scalar_one_or_none()
        
        if not existing_cat:
            category = Category(
                **cat_data,
                is_active=True
            )
            db.add(category)
            await db.flush()
            categories[cat_data["name"]] = category
            logger.info(f"  ✓ Created category: {cat_data['name']}")
        else:
            categories[cat_data["name"]] = existing_cat
            logger.info(f"  ✓ Category exists: {cat_data['name']}")
    
    # 2. Create Units (14 Essential Units for Kenyan Retail)
    units_data = [
        {"name": "pc", "display_order": 1},       # pieces
        {"name": "kg", "display_order": 2},       # kilograms
        {"name": "g", "display_order": 3},        # grams
        {"name": "l", "display_order": 4},        # liters
        {"name": "ml", "display_order": 5},       # milliliters
        {"name": "hr", "display_order": 6},       # hours
        {"name": "box", "display_order": 7},
        {"name": "pack", "display_order": 8},
        {"name": "bag", "display_order": 9},
        {"name": "dozen", "display_order": 10},
        {"name": "set", "display_order": 11},
        {"name": "pair", "display_order": 12},
        {"name": "service", "display_order": 13},
        {"name": "session", "display_order": 14},
    ]
    
    for unit_data in units_data:
        result = await db.execute(
            select(Unit).where(
                Unit.name == unit_data["name"]
            )
        )
        existing_unit = result.scalar_one_or_none()
        
        if not existing_unit:
            unit = Unit(
                **unit_data,
                is_active=True
            )
            db.add(unit)
            logger.info(f"  ✓ Created unit: {unit_data['name']}")
    
    await db.flush()
    
    # 3. Create Sample Products
    products_data = [
        # Academics
        {
            "name": "Tuition Fee - Grade 1",
            "sku": "ACAD-001",
            "description": "Termly tuition fee for Grade 1",
            "base_cost": 0,
            "selling_price": 15000,
            "quantity": 1000,
            "category": "Academics",
            "unit": "session",
            "reorder_level": 0
        },
        {
            "name": "Examination Fee",
            "sku": "ACAD-002",
            "description": "Annual internal examination fee",
            "base_cost": 0,
            "selling_price": 2000,
            "quantity": 1000,
            "category": "Academics",
            "unit": "session",
            "reorder_level": 0
        },
        # Uniforms
        {
            "name": "School Sweater (Medium)",
            "sku": "UNI-001",
            "description": "Branded school sweater",
            "base_cost": 800,
            "selling_price": 1200,
            "quantity": 50,
            "category": "Uniforms",
            "unit": "pcs",
            "reorder_level": 10
        },
        {
            "name": "School Tie",
            "sku": "UNI-002",
            "description": "Official school tie",
            "base_cost": 150,
            "selling_price": 300,
            "quantity": 100,
            "category": "Uniforms",
            "unit": "pcs",
            "reorder_level": 20
        },
        # Extra-Curricular
        {
            "name": "Swimming Club Membership",
            "sku": "EXT-001",
            "description": "Annual swimming club fee",
            "base_cost": 0,
            "selling_price": 3000,
            "quantity": 100,
            "category": "Extra-Curricular",
            "unit": "session",
            "reorder_level": 0
        },
        # Stationery
        {
            "name": "Exercise Book A4 120pg",
            "sku": "STA-001",
            "description": "Branded exercise book",
            "base_cost": 45,
            "selling_price": 70,
            "quantity": 500,
            "category": "Stationery",
            "unit": "pcs",
            "reorder_level": 50
        },
        {
            "name": "Mathematical Set",
            "sku": "STA-002",
            "description": "Oxford mathematical set",
            "base_cost": 250,
            "selling_price": 400,
            "quantity": 100,
            "category": "Stationery",
            "unit": "pcs",
            "reorder_level": 10
        },
        # Boarding
        {
            "name": "Boarding Fee - Term 1",
            "sku": "BRD-001",
            "description": "Full board accommodation",
            "base_cost": 0,
            "selling_price": 25000,
            "quantity": 200,
            "category": "Boarding",
            "unit": "session",
            "reorder_level": 0
        },
    ]
    
    from models import StockMovement, StockMovementType
    
    for prod_data in products_data:
        # Check if product exists
        result = await db.execute(
            select(Product).where(
                Product.tenant_id == tenant.id,
                Product.sku == prod_data["sku"]
            )
        )
        existing_product = result.scalar_one_or_none()
        
        if not existing_product:
            category_name = prod_data.pop("category")
            category = categories[category_name]
            
            product = Product(
                tenant_id=tenant.id,
                category_id=category.id,
                is_available=True,
                is_service=False,
                **prod_data
            )
            db.add(product)
            await db.flush()
            
            # Add initial stock movement
            movement = StockMovement(
                product_id=product.id,
                user_id=admin_user.id,
                movement_type=StockMovementType.IN,
                quantity=product.quantity,
                previous_stock=0,
                new_stock=product.quantity,
                notes="Initial demo data"
            )
            db.add(movement)
            logger.info(f"  ✓ Created product: {product.name}")
    
    await db.commit()
    logger.info(f"✅ Demo data seeded successfully for {tenant.name}")


async def seed_demo_data_on_startup(db: AsyncSession):
    """
    Main entry point for auto-seeding demo data on app startup.
    
    Behavior:
    - Controlled by SEED_DEMO_DATA environment variable
    - Only runs if database is empty (no customer data)
    - Idempotent - safe to call multiple times
    
    Environment Variables:
        SEED_DEMO_DATA: "true" to enable auto-seeding (default: "true")
    """
    # Check environment variable
    seed_enabled = os.getenv("SEED_DEMO_DATA", "true").lower() == "true"
    
    if not seed_enabled:
        logger.info("Demo data seeding disabled via SEED_DEMO_DATA=false")
        return
    
    # Check if database is empty
    if not await is_database_empty(db):
        logger.info("Database contains customer data - skipping demo data seed")
        return
    
    logger.info("=" * 60)
    logger.info("Database is empty - seeding demo data...")
    logger.info("=" * 60)
    
    # Get or create demo tenant
    result = await db.execute(
        select(Tenant).where(Tenant.subdomain == "demo")
    )
    demo_tenant = result.scalar_one_or_none()
    
    if not demo_tenant:
        logger.warning("Demo tenant not found - it should have been created at startup")
        return
    
    # Get admin user
    result = await db.execute(
        select(User).where(User.username == "admin")
    )
    admin_user = result.scalar_one_or_none()
    
    if not admin_user:
        logger.warning("Admin user not found - it should have been created at startup")
        return
    
    # Seed demo data
    try:
        await seed_demo_tenant_data(db, demo_tenant, admin_user)
        logger.info("=" * 60)
        logger.info("✅ Demo data seeding completed successfully!")
        logger.info("=" * 60)
    except Exception as e:
        logger.error(f"❌ Error seeding demo data: {e}")
        await db.rollback()
        raise
