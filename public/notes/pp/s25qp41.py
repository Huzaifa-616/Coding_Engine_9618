#q1 a

Queue = [-1 for i in range(20)]
HeadPointer = -1
TailPointer = -1
NumberItems = 0

#q1 b

def Enqueue(val):
    global HeadPointer, TailPointer, NumberItems
    NumberItems = len(Queue)
    if TailPointer == (HeadPointer - 1) % NumberItems:
        return False
    else:
        if TailPointer == -1:
            TailPointer = 0
            HeadPointer = 0
        else:
            TailPointer = (TailPointer + 1) % NumberItems
        Queue[TailPointer] = val
        return True

#q1 c

for j in range(1, 26):
    Enqueue(j)
    print(j)
    if Enqueue(j) == True:
        print("Successful")
    else:
        print("Unsuccessful")

#q1 d

def Dequeue():
    global HeadPointer, TailPointer, NumberItems
    if HeadPointer == -1:
        return -1
    else:
        result = Queue[HeadPointer]
        if HeadPointer == TailPointer:
            HeadPointer = -1
            TailPointer = -1
        else:
            HeadPointer = (HeadPointer + 1) % NumberItems
        return result

print(Dequeue())
print(Dequeue())