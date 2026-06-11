list1 =        [None, None, None, None, None, None, None, None, None, None, None, None]
list_pointer = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, -1]
head = -1
free = 0
null = -1

def insert(item):
    global head, free
    if free == null:
        print("linked list is full.")
    else:
        list1[free] = item
        temp = free
        free = list_pointer[free]
        if head == null:
            head = temp
            list_pointer[head] = null
        elif item < list1[head]:
            list_pointer[temp] = head
            head = temp
        else:
            index = head
            while index != null and list1[index] < item: #while index != null and list1[index] is not None and list1[index] < item:  # Check that index is not null and value is not None
                old = index
                index = list_pointer[index]
            list_pointer[old] = temp
            list_pointer[temp] = index

insert(20)
insert(15)
insert(25)
print(list1)
print(list_pointer)