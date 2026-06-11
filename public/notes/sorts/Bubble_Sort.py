list1 = [70 ,46, 43, 27, 57, 42, 45, 21, 14]
lb = 0
ub = len(list1) - 1
swap = True
while swap == True :
    swap = False
    for i in range(lb , ub):
        if list1[i] > list1[i + 1]:
            temp = list1[i]
            list1[i] = list1[i + 1]
            list1[i + 1] = temp
            swap = True
    ub -= 1
print(list1)