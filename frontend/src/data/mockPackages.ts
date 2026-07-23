export interface Package {
  id: string;
  name: string;
  destination: string;
  days: number;
  price: number;
  imageUrl: string;
  inclusions: string[];
}

export const mockPackages: Package[] = [
  {
    id: 'pkg-1',
    name: 'Serene Kerala Backwaters',
    destination: 'Kerala, India',
    days: 5,
    price: 18500,
    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
    inclusions: ['Houseboat Stay', 'All Meals', 'Airport Transfer', 'Sightseeing']
  },
  {
    id: 'pkg-2',
    name: 'Goa Monsoon Magic',
    destination: 'Goa, India',
    days: 4,
    price: 12000,
    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
    inclusions: ['4-Star Hotel', 'Breakfast', 'North Goa Tour', 'Cruises']
  },
  {
    id: 'pkg-3',
    name: 'Himalayan Retreat',
    destination: 'Manali, India',
    days: 6,
    price: 22000,
    imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80',
    inclusions: ['Snow Activities', 'Cottage Stay', 'Dinner', 'Private Cab']
  },
  {
    id: 'pkg-4',
    name: 'Andaman Honeymoon Special',
    destination: 'Andaman & Nicobar',
    days: 7,
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
    inclusions: ['Beach Resort', 'Scuba Diving', 'Ferry Transfers', 'Romantic Dinner']
  }
];
