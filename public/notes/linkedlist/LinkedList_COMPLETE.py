myData = [None for i in range (12)]
myPointer = [1,2,3,4,5,6,7,8,9,10,11,-1]
head = -1
free = 0
null = -1

def insert(itemAdd):
    global head, free
    if free == null:
        print("linked list full")
    else:
        myData[free] = int(itemAdd)
        temp = free
        free = myPointer[free]
        if head == null:    #starting
            head = temp
            myPointer[head] = null
        elif int(itemAdd) < myData[head]: #after first val
            myPointer[temp] = head
            head = temp
        else:     #middle or end
            index = head
            while index != null and myData[index] < int(itemAdd):
                oldindex = index
                index = myPointer[index]
            myPointer[oldindex] = temp
            myPointer[temp] = index

def InsertData(item):
        global free, head
        if free == null:
            print("Queue is full") # Added a print statement here just for clarity
        else:
            myData[free] = item
            temp = free
            free = myPointer[free]
            
            # --- UNORDERED LOGIC START ---
            
            # Since this new node goes at the end, its pointer will always be -1
            myPointer[temp] = -1 
            
            # Scenario A: The list is completely empty
            if head == -1:
                head = temp
                
            # Scenario B: The list has items, so append to the end
            else:
                index = head
                
                # Traverse the list until we hit the last node (the one pointing to -1)
                while myPointer[index] != -1:
                    index = myPointer[index]
                    
                # Attach the new node to the end of the list
                myPointer[index] = temp

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


def find(itemSearch):
    found = False   
    itempointer = head
    while itempointer != null and not found:
        if myData[itempointer] == itemSearch:
            found = True
        else:
            itempointer = myPointer[itempointer]
    if found != True:
            print("item not found")
    else:
        print("item found")

def listitems():
    if head == null:
        print("list empty")
    else:
        index = head
        while index!= null:
            print(myData[index])
            index = myPointer[index]
