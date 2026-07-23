-- TripMate AI — Seed Data (Sample Packages)

INSERT INTO `packages` (`id`, `name`, `destination`, `category`, `days`, `price_per_person`, `child_price`, `hotel_category`, `meals_included`, `food_preference`, `inclusions`, `exclusions`, `itinerary`, `image_url`, `status`) VALUES

('PKG-KER-001', 'Kerala Backwaters Bliss', 'Kerala', 'family', 5, 18999.00, 12999.00, '3-star', 'breakfast+dinner', 'any',
'["Houseboat stay (1 night)","AC accommodation","Airport transfers","Sightseeing by AC vehicle","Welcome drink"]',
'["Airfare","Personal expenses","Tips","Any meals not mentioned","Camera fees at monuments"]',
'[{"day":1,"title":"Arrival in Kochi","desc":"Airport pickup, check-in, Fort Kochi sightseeing — Chinese Fishing Nets, St. Francis Church, Mattancherry Palace"},{"day":2,"title":"Munnar","desc":"Drive to Munnar, visit Tea Museum, Eravikulam National Park (seasonal)"},{"day":3,"title":"Alleppey","desc":"Drive to Alleppey, board luxury houseboat, backwaters cruise, overnight on houseboat"},{"day":4,"title":"Kovalam","desc":"Check out from houseboat, drive to Kovalam beach, leisure at beach"},{"day":5,"title":"Departure","desc":"Breakfast, airport drop"}]',
'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600',
'active'),

('PKG-KER-002', 'Kerala Honeymoon Special', 'Kerala', 'honeymoon', 6, 24999.00, NULL, '4-star', 'breakfast+dinner', 'any',
'["Premium houseboat (1 night)","4-star resort stay","Couple spa session","Candlelight dinner","Airport transfers","All sightseeing"]',
'["Airfare","Personal expenses","Alcoholic beverages","Room service beyond complimentary"]',
'[{"day":1,"title":"Arrival Kochi","desc":"Welcome with garland, luxury transfer to Munnar"},{"day":2,"title":"Munnar Honeymoon","desc":"Tea gardens, waterfall visit, couple photoshoot"},{"day":3,"title":"Thekkady","desc":"Periyar Wildlife Sanctuary boat cruise, spice garden tour"},{"day":4,"title":"Alleppey Houseboat","desc":"Premium AC houseboat, backwaters cruise, candlelight dinner onboard"},{"day":5,"title":"Kovalam Beach Resort","desc":"Ayurvedic couple massage, beach leisure"},{"day":6,"title":"Departure","desc":"Breakfast and fond farewell"}]',
'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
'active'),

('PKG-GOA-001', 'Goa Beach Party Package', 'Goa', 'budget', 4, 11999.00, 7999.00, '3-star', 'breakfast', 'any',
'["AC hotel stay","Airport transfers","North Goa sightseeing","Cruise dinner (1 night)","Welcome drink"]',
'["Airfare","Lunch & dinner (except cruise)","Water sports","Personal expenses","Visa"]',
'[{"day":1,"title":"Arrival","desc":"Airport pickup, check-in at North Goa hotel, evening at Calangute/Baga beach"},{"day":2,"title":"North Goa Tour","desc":"Fort Aguada, Chapora Fort, Anjuna Flea Market, Vagator Beach"},{"day":3,"title":"South Goa + Cruise","desc":"Colva, Palolem beaches, evening Mandovi River Cruise with live music"},{"day":4,"title":"Departure","desc":"Breakfast, leisure, airport drop"}]',
'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
'active'),

('PKG-MAN-001', 'Manali Snow Adventure', 'Manali', 'adventure', 6, 16999.00, 11999.00, '3-star', 'breakfast+dinner', 'veg',
'["Hotel stay","Volvo bus tickets (Delhi-Manali-Delhi)","All sightseeing","Snow activity charges","Meals as mentioned"]',
'["Airfare","Personal expenses","Paragliding (optional)","Any adventure sports beyond package","Tips"]',
'[{"day":1,"title":"Delhi to Manali (Overnight Bus)","desc":"Board Volvo bus from Delhi evening"},{"day":2,"title":"Arrival Manali","desc":"Reach Manali morning, check-in, rest, evening Mall Road walk"},{"day":3,"title":"Solang Valley & Rohtang","desc":"Snow activities at Solang Valley, visit Rohtang Pass (seasonal permit)"},{"day":4,"title":"Kullu + Manikaran","desc":"Kullu valley, Manikaran Sahib Gurudwara, hot springs"},{"day":5,"title":"Local Manali Sightseeing","desc":"Hadimba Temple, Manu Temple, Van Vihar, Old Manali market"},{"day":6,"title":"Return to Delhi","desc":"Board overnight Volvo, reach Delhi next morning"}]',
'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=600',
'active'),

('PKG-AND-001', 'Andaman Islands Explorer', 'Andaman', 'luxury', 6, 34999.00, 22999.00, '4-star', 'breakfast+dinner', 'any',
'["4-star hotel stay","Flight tickets (Chennai/Kolkata to Port Blair return)","All ferry transfers","All sightseeing","Snorkeling at Elephant Beach","Cellular Jail Sound & Light Show"]',
'["Personal expenses","Scuba diving (optional ₹3500)","Alcoholic beverages","Tips","Any meals not mentioned"]',
'[{"day":1,"title":"Port Blair Arrival","desc":"Airport pickup, Cellular Jail, Corbyn Cove beach, Sound & Light Show"},{"day":2,"title":"Havelock Island","desc":"Ferry to Havelock, Radhanagar Beach (Asia''s best beach), sunset view"},{"day":3,"title":"Elephant Beach","desc":"Snorkeling, coral reef viewing, beach leisure"},{"day":4,"title":"Neil Island","desc":"Ferry to Neil Island, Bharatpur Beach, Laxmanpur Beach, Natural Bridge"},{"day":5,"title":"Return to Port Blair","desc":"Ferry back, shopping at Aberdeen Bazaar, North Bay Island viewing"},{"day":6,"title":"Departure","desc":"Breakfast and airport drop"}]',
'https://images.unsplash.com/photo-1562602833-0f4ab2fc46e3?w=600',
'active'),

('PKG-RAJ-001', 'Rajasthan Royal Heritage Tour', 'Rajasthan', 'luxury', 8, 28999.00, 18999.00, '4-star', 'breakfast+dinner', 'veg',
'["Heritage hotel/haveli stay","All transfers by AC vehicle","All sightseeing","Camel safari (Jaisalmer)","Cultural evening at Chokhi Dhani"]',
'["Airfare","Personal expenses","Entry fees at monuments","Tips","Alcoholic beverages"]',
'[{"day":1,"title":"Jaipur Arrival","desc":"City Palace, Hawa Mahal, Jantar Mantar"},{"day":2,"title":"Jaipur - Amber","desc":"Amber Fort elephant ride, Nahargarh Fort sunset"},{"day":3,"title":"Jaipur to Pushkar","desc":"Brahma Temple, Pushkar Lake, camel fair ground"},{"day":4,"title":"Pushkar to Jodhpur","desc":"Blue City, Mehrangarh Fort, Jaswant Thada"},{"day":5,"title":"Jodhpur to Jaisalmer","desc":"Golden City, Jaisalmer Fort, Patwon Ki Haveli"},{"day":6,"title":"Desert Safari","desc":"Sam Sand Dunes, camel safari, cultural night under stars"},{"day":7,"title":"Jaisalmer to Udaipur (via flight/train)","desc":"City of Lakes, Lake Pichola, City Palace"},{"day":8,"title":"Udaipur Departure","desc":"Saheliyon Ki Bari, airport drop"}]',
'https://images.unsplash.com/photo-1477587458883-47145ed31459?w=600',
'active');
