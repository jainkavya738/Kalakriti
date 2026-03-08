import asyncio
import traceback
from app.routes.orders import place_order
from app.models.order import OrderCreate

async def test():
    try:
        order = OrderCreate(
            product_id='674d258f-735a-4910-a852-98f3ad9aa098',
            buyer_name='test',
            buyer_email='test@test.com',
            buyer_phone='123',
            message='test'
        )
        res = await place_order(order)
        print("Success:", res)
    except Exception as e:
        print("Error:")
        print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(test())
