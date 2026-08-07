export type Product = {
  id: string;
  name: string;
  description: string;
  specifications: string;
  price: number;
  discount_price: number | null;
  stock: number;
  image_url: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  pin_code: string;
  total_amount: number;
  payment_method: 'COD' | 'UPI';
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
};

export type Settings = {
  id: string;
  store_name: string;
  phone: string;
  address: string;
  whatsapp_number: string;
  upi_id: string;
  delivery_charges: number;
};
