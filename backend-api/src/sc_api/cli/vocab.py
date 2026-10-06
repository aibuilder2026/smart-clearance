"""What the synthetic world is made of: fictional companies, products and partners, in real Indian places.

Every company, person and figure is fictional, and every address is on a reserved .example domain. Person names
come from Faker (en_IN); everything else is picked from these lists by a seeded generator.
"""

COMPANY_STEMS = [
    "Annapurna",
    "Sahyadri",
    "Kaveri",
    "Nilgiri",
    "Saraswati",
    "Vindhya",
    "Godavari",
    "Malabar",
    "Aravali",
    "Narmada",
    "Konkan",
    "Doaba",
    "Chambal",
    "Satpura",
]

# the console's industries (the New client flow's list), each with the word its companies end in and its products:
# (name, pack, MRP range in rupees, GST rate, shelf life in days)
INDUSTRIES: dict[str, tuple[str, list[tuple[str, str, tuple[int, int], float, int]]]] = {
    "Snacks and drinks": (
        "Snacks",
        [
            ("Masala Peanuts", "150 g", (25, 40), 0.12, 180),
            ("Banana Chips", "100 g", (30, 45), 0.05, 120),
            ("Jeera Cookies", "200 g", (35, 50), 0.18, 240),
            ("Lemon Drink", "250 ml", (20, 30), 0.12, 180),
            ("Aloo Bhujia", "200 g", (40, 60), 0.12, 180),
            ("Coconut Cookies", "150 g", (25, 35), 0.18, 240),
            ("Rose Sharbat", "750 ml", (110, 150), 0.12, 365),
        ],
    ),
    "Personal care": (
        "Naturals",
        [
            ("Neem Face Wash", "100 ml", (90, 140), 0.18, 730),
            ("Herbal Shampoo", "180 ml", (120, 180), 0.18, 730),
            ("Turmeric Soap", "4 x 75 g", (110, 160), 0.18, 900),
            ("Aloe Body Lotion", "200 ml", (150, 220), 0.18, 730),
            ("Coconut Hair Oil", "200 ml", (95, 140), 0.05, 730),
        ],
    ),
    "Dairy": (
        "Dairy",
        [
            ("Masala Chaas", "200 ml", (12, 18), 0.05, 10),
            ("Paneer", "200 g", (80, 100), 0.05, 15),
            ("Dahi", "400 g", (35, 45), 0.05, 12),
            ("Desi Ghee", "500 ml", (300, 380), 0.12, 270),
            ("Mango Lassi", "200 ml", (20, 28), 0.12, 30),
            ("Milk Peda", "250 g", (110, 150), 0.05, 20),
        ],
    ),
    "Staples": (
        "Staples",
        [
            ("Thick Poha", "500 g", (40, 60), 0.05, 270),
            ("Besan", "1 kg", (90, 120), 0.05, 180),
            ("Bombay Rava", "500 g", (30, 45), 0.05, 180),
            ("Instant Upma Mix", "200 g", (45, 65), 0.12, 270),
            ("Sambar Masala", "100 g", (40, 55), 0.05, 365),
        ],
    ),
    "Home care": (
        "Home Care",
        [
            ("Dishwash Gel", "500 ml", (90, 130), 0.18, 730),
            ("Floor Cleaner", "1 l", (150, 200), 0.18, 730),
            ("Detergent Bar", "4 x 150 g", (40, 60), 0.18, 540),
            ("Toilet Cleaner", "500 ml", (85, 110), 0.18, 730),
        ],
    ),
}

CITIES = [
    ("Nagpur", "Maharashtra"),
    ("Pune", "Maharashtra"),
    ("Nashik", "Maharashtra"),
    ("Indore", "Madhya Pradesh"),
    ("Bhopal", "Madhya Pradesh"),
    ("Raipur", "Chhattisgarh"),
    ("Hyderabad", "Telangana"),
    ("Vijayawada", "Andhra Pradesh"),
    ("Coimbatore", "Tamil Nadu"),
    ("Madurai", "Tamil Nadu"),
    ("Mysuru", "Karnataka"),
    ("Hubballi", "Karnataka"),
    ("Kochi", "Kerala"),
    ("Lucknow", "Uttar Pradesh"),
    ("Kanpur", "Uttar Pradesh"),
    ("Jaipur", "Rajasthan"),
    ("Surat", "Gujarat"),
    ("Vadodara", "Gujarat"),
    ("Ludhiana", "Punjab"),
    ("Patna", "Bihar"),
    ("Bhubaneswar", "Odisha"),
    ("Guwahati", "Assam"),
]

DISTRIBUTOR_SUFFIXES = ["Traders", "Distributors", "Agencies", "& Sons", "Enterprises", "Marketing"]
KIRANA_NAMES = ["Shree Ganesh", "Jai Bhavani", "Sai", "Laxmi", "Om", "Balaji", "Durga", "Mahalaxmi", "New Bharat"]
KIRANA_SUFFIXES = ["Kirana", "General Stores", "Provision Store", "Super Mart"]
FOOD_BANKS = ["Annadaan Food Bank", "Roti Ghar Trust", "Sahaay Food Network", "Akshay Bhojan Foundation"]

# the colours the New client flow offers
COLOURS = ["#2563eb", "#16a34a", "#c2410c", "#7c3aed", "#0f766e", "#be123c"]

DEMO_NOTES = [
    "Two distributors around {city}; short-dated stock comes back every month.",
    "Our {product} goes close to expiry at the kiranas before it sells.",
    "We write off stock every quarter and would rather sell it.",
    "",
]

MEMBER_ROLES = [
    ("Regional Supply-Chain Manager", "Supply chain"),
    ("Finance & GST", "Finance & GST"),
    ("Sustainability & BRSR", "Sustainability & BRSR"),
]

# SC-47: why a person overrode one batch's quick-commerce gate: the gate, and the deal a warehouse agreed to
OVERRIDE_REASONS = [
    ("qcomPct", "Zepto's {city} warehouse agreed to take this lot at {v}% of its life"),
    ("qcomPct", "Instamart {city} takes this lot at {v}% for its clearance week"),
    ("blinkitDays", "Blinkit's {city} dark stores take this lot with {v} days left for a festive sale"),
]


def own_gates(life_days: int) -> dict[str, int] | None:
    """an SKU's own quick-commerce gates, where its shelf life makes the client's default wrong for it: long-life packs
    need more days for Blinkit, short-life snacks fewer (dairy stays on the default, which it never passes)"""
    if life_days >= 540:
        return {"blinkitDays": 180}
    if 90 <= life_days <= 150:
        return {"blinkitDays": 45, "qcomPct": 50}
    return None
