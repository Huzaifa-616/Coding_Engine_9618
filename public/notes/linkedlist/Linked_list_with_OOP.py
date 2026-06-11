#linked list with oop
# Complete Linked List Code
class Node:
    def __init__(self):
        self.data = ''
        self.pointer = 0
linkedlist = [Node() for i in range(11)]
freePointer = 0     # null pointer
startPointer = 0   # null pointer

def initialize():
    global freePointer
    for i in range(1,10):
        linkedlist[i].pointer = i+1
    linkedlist[10].pointer = 0
    freePointer = 1
def display():
    print('index','    ','Data','    ' ,'Pointer')
    for i in range(1,11):
        print(i,'        ',linkedlist[i].data,'          ',linkedlist[i].pointer)
    print('free Pointer', freePointer)
    print('start Pointer', startPointer)
def menu():
    print('1. insert data')
    print('2. remove data')
    print('3. print linked list')
    print('4. search data')
    print('5. exit')
    option = int(input('enter option number: '))
    if option == 1:
        insert()
    if option == 2:
        remove()
    if option == 3:
        printLinkedList()
    if option == 4:
        search()
    if option == 5:
        exit()
    display()
    menu()
def insert():
    global freePointer,startPointer
    userData = input('enter data to insert: ')
    linkedlist[freePointer].data = userData
    newNode = freePointer
    freePointer = linkedlist[freePointer].pointer

    currentPointer = startPointer
    previousPointer = 0
    while userData > linkedlist[currentPointer].data and currentPointer != 0:
        previousPointer = currentPointer
        currentPointer = linkedlist[currentPointer].pointer
    if currentPointer == startPointer:
        linkedlist[newNode].pointer = startPointer
        startPointer = newNode
    else:
        linkedlist[newNode].pointer = linkedlist[previousPointer].pointer
        linkedlist[previousPointer].pointer = newNode
def remove():
    global startPointer,freePointer
    dataToRemove = input('enter data to remove: ')
    previousPointer = 0
    currentPointer = startPointer
    while linkedlist[currentPointer].data != dataToRemove and currentPointer != 0:
        previousPointer = currentPointer
        currentPointer = linkedlist[currentPointer].pointer
    if currentPointer == startPointer:
        deletedNode = startPointer
        startPointer = linkedlist[startPointer].pointer
    else:
        deletedNode = currentPointer
        linkedlist[previousPointer].pointer = linkedlist[currentPointer].pointer

    linkedlist[deletedNode].pointer = freePointer
    freePointer = deletedNode

def printLinkedList():
    currentPointer = startPointer
    while currentPointer != 0:
        print(linkedlist[currentPointer].data)
        currentPointer = linkedlist[currentPointer].pointer
def search():
    searchData = input("enter data to search")
    currentPointer = startPointer
    while linkedlist[currentPointer].data != searchData and currentPointer !=0:
        currentPointer = linkedlist[currentPointer].pointer
    print('found at: ',currentPointer)




# Main Program
initialize()
menu()