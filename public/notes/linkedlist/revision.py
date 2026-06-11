myData = [None for i in range (12)]
myPointer = [1,2,3,4,5,6,7,8,9,10,11,-1]
head = -1
free = 0
null = -1

def insert(item):
    if free == null:
        print("empty")
    else:
        myData[free] = item
        temp = free
        free = myPointer[temp]
        if head == null:
            myPointer[temp] = null
            head = temp
        elif int(item) < myData[head]:
            myPointer[temp] = head
            head = temp
        else:
            index = head
            while index != null and item > myData[index]:
                oldindex = index
                index = myPointer[index]
            myPointer[oldindex] = temp
            myPointer[temp] = index



def delete(itemDelete):
    global head, free
    if head == null:
        print("empty linked list")
    else:
        index = head
        oldindex = null # Initialize to handle the case where head is the target
        
        # Traverse until we find the item or hit the end
        # Note: Check index != null FIRST to avoid out-of-bounds errors
        while index != null and myData[index] != itemDelete:
            oldindex = index
            index = myPointer[index]
            
        if index == null:
            # Case 1: Item not found
            print("Item not found in list")
        elif index == head:
            # Case 2: Item is at the head
            head = myPointer[head]
            myPointer[index] = free
            free = index
        else:
            # Case 3: Item is in the middle or at the end
            # Connect the previous node to the next node, skipping 'index'
            myPointer[oldindex] = myPointer[index]
            
            # Add the deleted index back to the 'free list'
            myPointer[index] = free
            free = index