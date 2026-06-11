global nRoot
global nFree

myData = [None, None, None, None, None ,None,None,None,None,None,None,None]
LeftPointer = [1,2,3,4,5,6,7,8,9,10,11,-1]
RightPointer = [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
nRoot = -1
nFree = 0
nullPointer = -1

def insert(itemAdd):
    global nRoot
    global nFree
    
    if nFree == nullPointer:
        print("Binary Tree is full") 
    else:
        myData[nFree] = int(itemAdd)
        temp = nFree
        nFree = LeftPointer[nFree]
        LeftPointer[temp] = nullPointer
        RightPointer[temp] = nullPointer
        
        if nRoot == nullPointer:            #for first item
            nRoot = temp
        else:
            index = nRoot
            flag = False
            while flag == False:
                if int(itemAdd) < myData[index]:
                    if LeftPointer[index] == nullPointer:
                        LeftPointer[index] = temp
                        flag = True
                    else:
                        index = LeftPointer[index]
                else:
                    if RightPointer[index] == nullPointer:
                        RightPointer[index] = temp
                        flag = True
                    else:
                        index = RightPointer[index]

def inorder(nPointer):
    if nRoot == nullPointer:
        print("List is empty")
    else:
        if LeftPointer[nPointer] != nullPointer:
            inorder(LeftPointer[nPointer])
        print(myData[nPointer])
        if RightPointer[nPointer] != nullPointer:
            inorder(RightPointer[nPointer])

def find(itemSearch):
    found = False
    index = nRoot
    while index != nullPointer and not found:
        if myData[index] == itemSearch:
            found = True
        else:
            if itemSearch < myData[index]:
                index = LeftPointer[index]
            else:
                index = RightPointer[index]
    return found