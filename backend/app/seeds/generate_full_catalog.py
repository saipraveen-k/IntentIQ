import os
import json
import random
import pandas as pd

IMAGE_MAP = {
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
  'avocado': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&auto=format&fit=crop&q=80',
  'strawberry': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80',
  'lemon': 'https://images.unsplash.com/photo-1534531148868-809f4e24ef54?w=600&auto=format&fit=crop&q=80',
  'lime': 'https://images.unsplash.com/photo-1534531148868-809f4e24ef54?w=600&auto=format&fit=crop&q=80',
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
  'onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
  'zucchini': 'https://images.unsplash.com/photo-1598170845058-12f6a67a05b2?w=600&auto=format&fit=crop&q=80',
  'asparagus': 'https://images.unsplash.com/photo-1515471209610-dae1c92d8777?w=600&auto=format&fit=crop&q=80',
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
  'orange': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
  'blueberry': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&auto=format&fit=crop&q=80',
  'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
  'cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
  'butter': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
  'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
  'egg': 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80',
  'chip': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'cookie': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80',
  'chocolate': 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&auto=format&fit=crop&q=80',
  'coffee': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
  'tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  'juice': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
  'water': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
  'headphone': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  'jeans': 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80',
  'sneakers': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
  'lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
  'chair': 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=600&auto=format&fit=crop&q=80',
  'mug': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
}

DEPT_IMAGE_MAP = {
  'produce': 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&auto=format&fit=crop&q=80',
  'dairy eggs': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80',
  'beverages': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80',
  'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&auto=format&fit=crop&q=80',
  'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'frozen': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
  'pantry': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80',
  'canned goods': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80',
  'meat seafood': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80',
  'dry goods pasta': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281288?w=600&auto=format&fit=crop&q=80',
  'breakfast': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
  'deli': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
  'personal care': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
  'household': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
  'babies': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
  'international': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80',
  'fashion': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
  'home': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
  'sports': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  'beauty': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
  'kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80'
}

DEPT_DISPLAY_NAMES = {
  'produce': 'Produce',
  'dairy eggs': 'Dairy & Eggs',
  'beverages': 'Beverages',
  'snacks': 'Snacks',
  'bakery': 'Bakery',
  'frozen': 'Frozen Foods',
  'pantry': 'Pantry',
  'canned goods': 'Canned Goods',
  'meat seafood': 'Meat & Seafood',
  'dry goods pasta': 'Pasta & Grains',
  'breakfast': 'Breakfast Foods',
  'deli': 'Deli Essentials',
  'personal care': 'Personal Care',
  'household': 'Household Cleaning',
  'babies': 'Baby Care',
  'international': 'International Foods'
}

def resolve_image(name, dept):
  n = name.lower()
  d = dept.lower().strip() if dept else ''
  for k, url in IMAGE_MAP.items():
    if k in n:
      return url
  for k, url in DEPT_IMAGE_MAP.items():
    if k in d:
      return url
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'

def generate():
  base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
  instacart_dir = os.path.join(base_dir, 'datasets', 'instacart')
  
  products_csv = os.path.join(instacart_dir, 'products.csv')
  departments_csv = os.path.join(instacart_dir, 'departments.csv')
  aisles_csv = os.path.join(instacart_dir, 'aisles.csv')
  
  p_df = pd.read_csv(products_csv)
  d_df = pd.read_csv(departments_csv)
  a_df = pd.read_csv(aisles_csv)
  
  df = p_df.merge(d_df, on='department_id').merge(a_df, on='aisle_id')
  
  # Try loading prior order count
  try:
    prior_csv = os.path.join(instacart_dir, 'order_products__prior.csv')
    prior = pd.read_csv(prior_csv, usecols=['product_id'])
    counts = prior['product_id'].value_counts().to_dict()
    df['order_count'] = df['product_id'].map(counts).fillna(0)
  except Exception as e:
    df['order_count'] = 0

  # Exclude 'missing', 'other', 'bulk'
  df = df[~df['department'].isin(['missing', 'other', 'bulk'])]

  # Take top 50 items per department (21 departments * 50 = 900+ items)
  top_df = df.sort_values(['department', 'order_count'], ascending=[True, False]).groupby('department').head(50)

  catalog = []
  
  # Add Instacart products
  for row in top_df.itertuples():
    dept_clean = DEPT_DISPLAY_NAMES.get(row.department, row.department.title())
    price = round(random.uniform(49.0, 499.0), 2)
    orig_price = round(price * random.uniform(1.15, 1.35), 2)
    rating = round(random.uniform(4.4, 4.9), 1)
    reviews = random.randint(120, 3500)
    
    img_url = resolve_image(row.product_name, row.department)
    
    catalog.append({
      "id": f"prod_{row.product_id}",
      "title": row.product_name,
      "description": f"Fresh {row.product_name} from top quality suppliers. Department: {dept_clean}, Aisle: {row.aisle.title()}.",
      "category": dept_clean,
      "sub_category": row.aisle.title(),
      "brand": "Fresh Select",
      "price": price,
      "original_price": orig_price,
      "rating": rating,
      "review_count": reviews,
      "image_url": img_url,
      "attributes": {
        "department": row.department,
        "aisle": row.aisle,
        "department_id": int(row.department_id),
        "aisle_id": int(row.aisle_id)
      },
      "in_stock": True
    })

  # Also append catalog_100 curated non-grocery products if file exists
  catalog_100_path = os.path.join(os.path.dirname(__file__), "catalog_100.json")
  if os.path.exists(catalog_100_path):
    try:
      with open(catalog_100_path, "r", encoding="utf-8") as f:
        existing = json.load(f)
        for item in existing:
          catalog.append(item)
    except Exception as e:
      print("Error loading catalog_100:", e)

  out_path = os.path.join(os.path.dirname(__file__), "catalog_full.json")
  with open(out_path, "w", encoding="utf-8") as f:
    json.dump(catalog, f, indent=2)

  print(f"Successfully generated catalog_full.json with {len(catalog)} items across {len(set(c['category'] for c in catalog))} categories!")

if __name__ == '__main__':
  generate()
