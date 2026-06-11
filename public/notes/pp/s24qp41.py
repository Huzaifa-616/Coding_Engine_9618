DataStored = []
global NumberItems

def Initialise():
    global NumberItems
    valid = False
    while valid == False:
        NumberItems = int(input("enter quantity of numbers: "))
        if NumberItems >= 1 and NumberItems <= 20:
            valid = True
    for i in range(0, NumberItems):
        DataStored.append(int(input("enter number: ")))
NumberItems = 0
Initialise()
print(DataStored)

def BubbleSort():
    global DataStored
    ub = NumberItems - 1
    swap = True
    while swap == True:
        swap = False
        for i in range(ub):
            if DataStored[i] > DataStored[i + 1]:
                temp = DataStored[i]
                DataStored[i] = DataStored[i + 1]
                DataStored[i + 1] = temp
                swap = True
        ub -= 1
BubbleSort()
print(DataStored)

def BinarySearch(DataToFind):
    ub = NumberItems - 1
    lb = 0
    found = False
    while found == False and ub >= lb:
        mid = (ub + lb) // 2
        if DataStored[mid] == DataToFind:
            found = True
        elif DataStored[mid] > DataToFind:
            ub = mid - 1
        else:
            lb = mid + 1
    if found:
        return mid
    else:
        return -1
val = int(input("enter value to find: "))
result = BinarySearch(val)
print(result)