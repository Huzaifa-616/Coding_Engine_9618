list1 = [4, 2, 8, 17, 9, 3, 7, 12, 34, 21]
value = int(input('enter item to find from the list: '))
i = 0
found = False
size = len(list1)-1

while found == False and i <= size:
    if list1[i] == value:
        found = True
    else:    
        i += 1

if found == True:
    print(f'item found at index: {i}')
else:
    print('item not found')