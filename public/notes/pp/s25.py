"""global Stack #array of 20 elements
global TopOfStack

Stack = [-1 for i in range(20)]
TopOfStack = -1
def push(item):
    global TopOfStack, Stack
    if TopOfStack == len(Stack) - 1:
        return -1
    else:
        TopOfStack += 1
        Stack[TopOfStack] = item
        return 1
    
def pop():
    global TopOfStack, Stack
    if TopOfStack == -1:
        return "-1"
    else:
        item = Stack[TopOfStack]
        TopOfStack -= 1
        return item

def ReadData(fname):
    global TopOfStack, Stack
    try:
        file = open(fname)
        for line in file:
            status = push(line.strip())
            if status == -1:
                print("stack is full")
        file.close()
    except IOError:
        print("file not found")
    

def Calculate():
    global TopOfStack, Stack
    total = int(pop())
    flag = False
    while flag == False:
        operator = pop()
        val = int(pop())
        if operator == -1 or val == -1:
            flag = True
        elif operator == "+":
            total = total + val
        elif operator == "-":
            total = total - val
        elif operator == "/":
            total = total / val
        elif operator == "*":
            total = total * val
        elif operator == "^":
            total = total ** val
    return total

fname = input("enter file name: ")
ReadData(fname)
total = Calculate()
print(total)
"""

#Q2

"""class NewRecord:
    def __init__(self, pkey, pitem1, pitem2):
        self.__Key = pkey
        self.__Item1 = pitem1
        self.__Item2 = pitem2
    def getkey(self):
        return self.__Key
    def getitem1(self):
        return self.__Item1
    def getitem2(self):
        return self.__Item2

global Hashtable #array of 200 elements
global Spare #array of 100 elements
Hashtable = []
Spare = []

def Initialise():
    for i in range(200):
        Hashtable.append(NewRecord(-1,-1,-1))
    for i in range(100):
        Spare.append(NewRecord(-1,-1,-1))

def CalculateHash(keyfield):
    hashvalue = int(keyfield) % 200
    return hashvalue

def InsertIntoHash(record):
    key = record.getkey()
    index = CalculateHash(key)
    if Hashtable[index].getkey() == -1:
        Hashtable[index] = record
    else:
        for i in range(100):
            if Spare[i].getkey() == -1:
                Spare[i] = record
                break
    
def CreateHashTable():
    file = open("HashData.txt")

    for line in file:
        line = line.strip().split(",")
        key = line[0]
        item1 = line[1]
        item2 = line[2]
        record = NewRecord(int(key), int(item1), int(item2))
        InsertIntoHash(record)
    file.close()

def PrintSpare():
    global Spare
    for i in Spare:
        if i.getkey() != -1:
            print(i.getkey())
Initialise()
CreateHashTable()
PrintSpare()
"""

#Q3

class Animal:
    def __init__(self, pname, psound, psize, pintelligence):
        self.__Name = pname
        self.__Sound = psound
        self.__Size = psize
        self.__Intelligence = pintelligence

    def Description(self):
        return "The animal's name is " ,self.__Name, ", it makes a " ,self.__Sound,  ", its size is ", self.__Size ," and its intelligence level is " ,self.__Intelligence

class Parrot(Animal):
    def __init__(self, pname, psound, psize, pintelligence, pwingspan, pnumberwords):
        self.__WingSpan = pwingspan
        self.__NumberWords = pnumberwords
        Animal.__init__(pname, psound, psize, pintelligence)

    def ChangeNumberWords(self, pnumberwords):
        self.__NumberWords = pnumberwords
    
    def Description(self):
        return "The animal's name is " ,self.__Name, ", it makes a " ,self.__Sound, ", its size is " ,self.__Size, " and its intelligence level is " ,self.__Intelligence, ". It has a wingspan of " ,self.__WingSpan, "cm and can say " ,self.__NumberWords, " words."

class Wolf(Animal):
    def __init__(self, pname, psound, psize, pintelligence, pterritorysize):
        self.__TerritorySize = pterritorysize
        Animal.__init__(pname, psound, psize, pintelligence)

    def SetTerritorySize(self, size):
        self.__TerritorySize = self.__TerritorySize + size
    
    def Description(self):
        return "The animal's name is " ,self.__Name, ", it makes a " ,self.__Sound,  ", its size is ", self.__Size ," and its intelligence level is " ,self.__Intelligence, ". Its territory is " ,self.__TerritorySize, " square miles."

parrot = Parrot("Chewie", "Squak", 1, 10, 30, 29)
wolf = Wolf("Nighteyes", "Howl", 8, 7, 100)
horse = Animal("Cooper", "Neigh", 10, 6)
