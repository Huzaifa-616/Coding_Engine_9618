#numbers case. dont run here. run it in a different file.
list1 = [4, 2, 17, 24, 25, 28, 41, 50, 77]
list1 = sorted(list1)
lb = 0
ub = len(list1) - 1
found = False

value = int(input('enter item to search: '))

while lb <= ub and found == False:
    mid = (lb + ub) // 2
    if list1[mid] == value:
        found = True
        
    elif value > list1[mid]:
        lb = mid + 1
    elif value < list1[mid]:
        ub = mid - 1

if found:
    print(f"item found at index: {mid}.")
else:
    print("item not found.")
#alphabetical case
list1 = ["Abdullah", "Adil", "Bilal", "Bilawal", "David", "Macvtavish", "Simon"]

top = 0
end = len(list1)
found = False
value = input("enter value to be located: ")

while found == False and top <= end:
    mid = (top + end) // 2
    if list1[mid] == value:
        found = True
    elif list1[mid] > value:
        end = mid - 1
    else:
        top = mid + 1
if found == True:
    print("value found at index: ", mid)
else:
    print('value not found.')