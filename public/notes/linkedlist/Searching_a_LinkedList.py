#finding items in a linked list

list1 = [27, 19, 36, 42, 16, None, None, None, None, None, None, None]
list_pointer = [-1, 0, 1, 2, 3, 6, 7, 8, 9, 10, 11, -1]
head = 4
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
 
 #enter item to search
item = int(input("enter item to search for: "))
result = find(item)
if result == -1:
    print("item not found.")
else:
    print(f"item found at: {result}.")