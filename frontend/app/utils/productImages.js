// High resolution web images curated specifically for storefront items in the dataset

const PRODUCT_IMAGE_MAP = {
  // Fresh Produce & Grocery
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
  'organic banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
  'avocado': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&auto=format&fit=crop&q=80',
  'strawberry': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80',
  'strawberries': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80',
  'lemon': 'https://images.unsplash.com/photo-1534531148868-809f4e24ef54?w=600&auto=format&fit=crop&q=80',
  'lime': 'https://images.unsplash.com/photo-1534531148868-809f4e24ef54?w=600&auto=format&fit=crop&q=80',
  'limes': 'https://images.unsplash.com/photo-1534531148868-809f4e24ef54?w=600&auto=format&fit=crop&q=80',
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
  'onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
  'zucchini': 'https://images.unsplash.com/photo-1598170845058-12f6a67a05b2?w=600&auto=format&fit=crop&q=80',
  'asparagus': 'https://images.unsplash.com/photo-1515471209610-dae1c92d8777?w=600&auto=format&fit=crop&q=80',
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
  'orange': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
  'blueberry': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&auto=format&fit=crop&q=80',
  'blueberries': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&auto=format&fit=crop&q=80',
  'grape': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&auto=format&fit=crop&q=80',
  'grapes': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&auto=format&fit=crop&q=80',
  'tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  'tomatoes': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  'carrot': 'https://images.unsplash.com/photo-1598170845058-12f6a67a05b2?w=600&auto=format&fit=crop&q=80',
  
  // Dairy & Eggs
  'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
  'cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
  'mozzarella': 'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=600&auto=format&fit=crop&q=80',
  'provolone': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
  'butter': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
  'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
  'egg': 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80',
  'eggs': 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80',

  // Snacks & Bakery
  'chip': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
  'chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'cookie': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80',
  'cookies': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80',
  'chocolate': 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&auto=format&fit=crop&q=80',

  // Beverages & Coffee
  'coffee': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
  'tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  'juice': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
  'water': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',

  // Electronics & Tech
  'headphone': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  'ipad': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
  'tablet': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
  'monitor': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
  'mouse': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
  'ssd': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
  'speaker': 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
  'power bank': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80',
  'keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
  'kindle': 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&auto=format&fit=crop&q=80',

  // Fashion & Apparel
  'jeans': 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80',
  'sneakers': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
  'shoes': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
  'hoodie': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
  'jacket': 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
  'sunglasses': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
  'blazer': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
  'watch': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
  't-shirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',

  // Home & Decor
  'lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
  'chair': 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=600&auto=format&fit=crop&q=80',
  'mug': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  'vacuum': 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80',
  'rug': 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&auto=format&fit=crop&q=80',
  'diffuser': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80',
  'table': 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&auto=format&fit=crop&q=80',
  'light': 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=600&auto=format&fit=crop&q=80',
  'vase': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80',

  // Sports & Fitness
  'weights': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  'yoga': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80',
  'smartwatch': 'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=600&auto=format&fit=crop&q=80',
  'basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80',
  'massage gun': 'https://images.unsplash.com/photo-1591940742878-13aba4b7a34e?w=600&auto=format&fit=crop&q=80',
  'bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',

  // Beauty & Kitchen
  'cleanser': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
  'serum': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
  'sunscreen': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80',
  'lip': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80',
  'dutch oven': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
  'mixer': 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=600&auto=format&fit=crop&q=80',
  'coffee machine': 'https://images.unsplash.com/photo-1517668808822-9ebe02f2a6e8?w=600&auto=format&fit=crop&q=80',
  'knife': 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600&auto=format&fit=crop&q=80',
  'instant pot': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  'book': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
};

const DEPARTMENT_IMAGE_MAP = {
  'produce': 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&auto=format&fit=crop&q=80',
  'dairy eggs': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80',
  'beverages': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80',
  'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&auto=format&fit=crop&q=80',
  'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'frozen': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
  'pantry': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80',
  'canned goods': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80',
  'meat seafood': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80',
  'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80',
  'fashion': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
  'home': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
  'home decor & lighting': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
  'beauty': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
  'kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
  'sports': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  'default': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
};

export const getProductImage = (item) => {
  if (!item) return DEPARTMENT_IMAGE_MAP['default'];

  // 1. If explicit image_url exists and is a valid URL (and not loremflickr), use it
  if (item.image_url && typeof item.image_url === 'string' && item.image_url.trim().length > 0) {
    if (!item.image_url.includes('loremflickr.com')) {
      return item.image_url;
    }
  }

  const name = (item.name || item.title || '').toLowerCase();
  const dept = (item.department || item.category || '').toLowerCase().trim();

  // 2. Try exact keyword matching on item title / name
  for (const [key, url] of Object.entries(PRODUCT_IMAGE_MAP)) {
    if (name.includes(key)) {
      return url;
    }
  }

  // 3. Department matching
  for (const [key, url] of Object.entries(DEPARTMENT_IMAGE_MAP)) {
    if (dept.includes(key)) {
      return url;
    }
  }

  // 4. Default fallback high quality grocery image
  return DEPARTMENT_IMAGE_MAP['default'];
};
