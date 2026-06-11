#important! front = (front + 1) % size .....the % size makes the queue circular.

Queue = [None for i in range(0,6)]
front = -1
rear = -1
size = 6
choice = 0
item = None

def deQueue():
    global rear, front
    if (front == -1):
        print("Queue is empty hehe.")
    else:
        item = Queue[front]
        if front == rear:
            rear = -1
            front = -1
        else:
            front = (front + 1) % size

def enQueue(item):
    global rear, front
    if (front == (rear + 1) % size):     #best option:  if (front == (rear + 1) % size):
        print("queue is full.")          # e.g 4 == (3+1 % 6 ---> 4)
    else:                                # e.g 0 == (5+1 % 6 ---> 0)
        if rear == -1:
            rear = 0
            front = 0
        else:
            rear = (rear + 1) % size
        Queue[rear] = item

while choice != 3:
    print("             Menue")
    print("1. enQueue")
    print("2. deQueue")
    print("3. Exit")
    
    if choice == 1:
        item = input("enter item: ")
        enQueue(item)
        print("item enqueued succesfully")
    elif choice == 2:
        deQueue
        print("deQueued succesfully")

