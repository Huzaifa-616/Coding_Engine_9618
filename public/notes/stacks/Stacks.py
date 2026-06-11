Stack = [None for index in range(6)]
StackPointer = -1
StackSize = 5
Choice = 0
Item = None

def pop():
    global StackPointer
    if StackPointer == -1:
        print("Stack is empty, cannot pop")
        return -1
    else:
        Stack[StackPointer] = None
        StackPointer = StackPointer - 1
        print(Item)
        print()

def push(Item):
    global StackPointer
    if StackPointer == StackSize:
        print("stack is full, cannot push")
        return -1
    else:
        StackPointer += 1
        Stack[StackPointer] = Item

while Choice != 3:
    print("     Menue")
    print("1. Push item on to stack ")
    print("2. Pop item from the stack ")
    print("3. Exit")
    print()
    Choice = int(input("enter choice: "))

    if Choice == 1:
        Item = input("enter Item: ")
        result = push(Item)
        if result == -1:
            print("stack is full")
        else:
            print("item succesfully inserted")
    elif Choice == 2:
        result = pop()
        if result == "-1":
            print("stack is empty")

            
print(Stack)