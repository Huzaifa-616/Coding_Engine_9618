list1 =        [27, 19, 36, 42, 16, None, None, None, None, None, None, None]
list_pointer = [-1, 0, 1, 2, 3, 6, 7, 8, 9, 10, 11, -1]
head = 4
free = 5
null = -1
def find(item):

    found = False
    pointer = head
    while pointer != null and found == False:
        if list1[pointer] == item:
            found = True
        else:
            pointer = list_pointer[pointer]
    return pointer

def insert(Additem):

    global head, free
    if free == null:
        print("linked list if full")
    else:
        temp = head
        head = free
        free = list_pointer[free]
        list1[head] = Additem
        list_pointer[head] = temp

def delete(Deleteitem):
    global head, free
    if head == null:
        print("linked list is empty")
    else:
        index = head        #index = 3
        while list1[index] != Deleteitem and index != null:
            old_index = index       #old = 3
            index = list_pointer[index] #index = 2
        if index == null:
            print(f"item {Deleteitem} not found")
        else:  
            list1[index] = None
            list_pointer[old_index] = list_pointer[index]
            list_pointer[index] = free
            free = index

def list_items():
    if head == null:
        print("linked list is empty")
    else:
        print(2)