Queue = [None for i in range(0,6)]
front = -1
rear = -1
QueueSize = 6
choice = 0
item = None

def deQueue():
    global front , rear
    if front == -1:
        print("sike, your queue is empty.")
    else:
        item = Queue[front]
        if front == rear:
            rear = -1              # as now the queue is empty so we make them -1
            front = -1
        else:
            front += 1

def enQueue(item):
    global rear, front
    if rear == QueueSize + 1:
        print("your queue is full :)")
    else:
        if rear == -1:
            rear = 0
            front = 0
        else:
            rear += 1
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

    