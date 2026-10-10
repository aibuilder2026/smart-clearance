"""SC-147 (the label maker): what each SKU's carton label says beyond its batch record: the ingredients, the carton's net quantity, the
storage line, and whether it is food (FSSAI's mark and licence, the veg mark) or a cosmetic (Glowra's face wash and hair
oil: a cosmetics manufacturing licence, no FSSAI, no veg mark, "use before"). Every name and number is fictional.
"""

FOOD_LIC = "10019022001234"  # Munchly's FSSAI licence (data.js CLIENT.fssai)
COSMETIC_LIC = "MH/COS/0117/2011"  # Glowra's cosmetics manufacturing licence (fictional)

SKUS = {
    "chips": {
        "name": "Masala Chips", "size": "150 g", "net": "3.6 kg", "perCarton": 24, "food": True,
        "ingredients": "Potatoes, Edible Vegetable Oil (Palmolein), Spices & Condiments (Red Chilli, Coriander, Cumin, "
        "Black Pepper), Salt, Sugar, Dried Mango Powder, Black Salt. Contains added natural flavours.",
        "store": "STORE IN A COOL, DRY PLACE AWAY FROM DIRECT SUNLIGHT",
    },
    "biscuits": {
        "name": "Choco Cream Biscuits", "size": "200 g", "net": "4.8 kg", "perCarton": 24, "food": True,
        "ingredients": "Refined Wheat Flour (Maida), Sugar, Edible Vegetable Oil (Palm), Cocoa Solids (4%), Invert Sugar "
        "Syrup, Milk Solids, Leavening Agents (503(ii), 500(ii)), Salt, Emulsifier (322). Contains wheat and milk.",
        "store": "STORE IN A COOL, DRY PLACE AWAY FROM DIRECT SUNLIGHT",
    },
    "chikki": {
        "name": "Peanut Chikki", "size": "100 g", "net": "3 kg", "perCarton": 30, "food": True,
        "ingredients": "Roasted Peanuts (55%), Jaggery (42%), Liquid Glucose, Edible Vegetable Oil (Groundnut), Cardamom. "
        "Contains peanuts.",
        "store": "STORE IN A COOL, DRY PLACE AWAY FROM DIRECT SUNLIGHT",
    },
    "poha": {
        "name": "Instant Poha", "size": "250 g", "net": "5 kg", "perCarton": 20, "food": True,
        "ingredients": "Flattened Rice (78%), Edible Vegetable Oil (Groundnut), Peanuts, Sugar, Salt, Onion Flakes, Curry "
        "Leaves, Green Chilli, Turmeric, Mustard Seeds, Acidity Regulator (330). Contains peanuts.",
        "store": "STORE IN A COOL, DRY PLACE AWAY FROM DIRECT SUNLIGHT",
    },
    "oats": {
        "name": "Masala Oats", "size": "200 g", "net": "4 kg", "perCarton": 20, "food": True,
        "ingredients": "Rolled Oats (76%), Dehydrated Vegetables (Carrot, Peas, Onion), Spices & Condiments, Salt, Sugar, "
        "Maltodextrin, Edible Vegetable Oil, Flavour Enhancers (627, 631). Contains oats (gluten).",
        "store": "STORE IN A COOL, DRY PLACE AWAY FROM DIRECT SUNLIGHT",
    },
    "mango": {
        "name": "Mango Drink", "size": "200 ml", "net": "5.4 L", "perCarton": 27, "food": True,
        "ingredients": "Water, Mango Pulp (19.5%), Sugar, Acidity Regulator (INS 330), Antioxidant (INS 300), Stabiliser "
        "(INS 440). Contains added flavour (nature identical flavouring substances).",
        "store": "STORE IN A COOL, DRY PLACE · SHAKE WELL · CONSUME SOON AFTER OPENING",
    },
    "facewash": {
        "name": "Aloe Face Wash", "size": "100 ml", "net": "1.2 L", "perCarton": 12, "food": False, "brand": "GLOWRA",
        "ingredients": "Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Glycerin, Aloe Barbadensis Leaf Juice, "
        "Sodium Chloride, Citric Acid, Phenoxyethanol, Fragrance.",
        "store": "FOR EXTERNAL USE ONLY · KEEP OUT OF REACH OF CHILDREN",
    },
    "hairoil": {
        "name": "Coconut Hair Oil", "size": "200 ml", "net": "2.4 L", "perCarton": 12, "food": False, "brand": "GLOWRA",
        "ingredients": "Cocos Nucifera (Coconut) Oil (99.5%), Tocopherol, Fragrance.",
        "store": "FOR EXTERNAL USE ONLY · STORE BELOW 30 °C",
    },
}
