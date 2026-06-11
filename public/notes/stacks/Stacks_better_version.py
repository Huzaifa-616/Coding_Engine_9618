stack = [None for i in range(0 , 6)]
print(stack)
start = -1
size = 5
item = 0

def pop():
    global start, item
    if start == -1:
        print('stack empty')
    else:
        print(stack[start])
        stack[start] = None
        start -= 1

def push(item):
    global start
    if start == size:
        print('stack is full')
    else:
        start += 1
        stack[start] = item

push(1)
push(2)
push(4)
push(7)
push(10)
push(11)
push(12)
push(13)
pop()
print(stack)
# menue (optional):
#while Choice != 3:
#    print("     Menue")
#    print("1. Push item on to stack ")
#    print("2. Pop item from the stack ")
#    print("3. Exit")
#    print()
#    Choice = int(input("enter choice: "))
#
#    if Choice == 1:
#        Item = input("enter Item: ")
#        result = push(Item)
#        if result == -1:
#            print("stack is full")
#        else:
#            print("item succesfully inserted")
#    elif Choice == 2:
#       result = pop()
#        if result == "-1":
#            print("stack is empty")
#print(stack)