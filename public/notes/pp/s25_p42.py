#Q1 a)
Stack = [None for i in range(20)] #array of 20 elements
TopOfStack = -1

#Q1 b)
def Push(value):
    global TopOfStack
    global Stack
    if TopOfStack == 20:
        return -1
    else:
        TopOfStack += 1
        Stack[TopOfStack] = value
        return 1
#Q1 c)
def Pop():
    global TopOfStack, Stack
    if TopOfStack == -1:
        return "-1"
    else:
        item = Stack[TopOfStack]
        Stack[TopOfStack] = None
        TopOfStack -= 1
        return item
#Q1 d)
def ReadData(filename):
    global Stack, TopOfStack
    try:
        file = open(filename,"r")
        item = file.readline()
        while item != "":
            value = Push(item.strip())
            if value == -1:
                print("stack full")
                break
            item = file.readline()
        file.close()
    except IOError:
        print("invalid file name")
#Q1 e)"""






#Q1 a)
Stack = [-1 for i in range(20)] #array of 20 elements
TopOfStack = -1

#Q1 b)
Size = len(Stack)
def Push(value):
    global Stack, TopOfStack
    if TopOfStack == 19:
        return -1
    else:
        TopOfStack += 1
        Stack[TopOfStack] = value
        return 1
    
#Q1 c)
def Pop():
    global Stack, TopOfStack
    if TopOfStack == -1:
        return "-1"
    else:
        value = Stack[TopOfStack]
        TopOfStack -= 1
        return value

#Q1 d)
def ReadData(filename):
    try:
        file = open(filename, "r")
        for line in file:
            result = Push(line.strip())
            if result == -1:
                print("Stack full")
        file.close()
    except IOError:
        print("Invalid File name")

#Q1 e)
def Calculate():
 global Stack
 global TopOfStack
 Total = Pop()
 Total = int(Total)
 Return = 0
 LastOperator = ""
 Operator = True
 while(Return != "-1"):
    Return = Pop()
    if Operator == False:
        Data = int(Return)
        if LastOperator == "+":
            Total = Total + Data
        elif LastOperator == "-":
            Total = Total - Data
        elif LastOperator == "*":
            Total = Total * Data
        elif LastOperator == "/":
            Total = Total / Data
        elif LastOperator == "^":
            Total = Total ** Data
            Operator = True
        else:
            LastOperator = Return
            Operator = False
 return Total

#Q1 f) i)
filename = input("enter valid filename: ")
ReadData(filename)
returnval = Calculate()
print(returnval)


#Q2 a)
"""HashTable = []
Spare = []

class NewRecord():
    def __init__(self, pkey, pitem1, pitem2):
        self.__Key = pkey
        self.__Item1 = pitem1
        self.__Item2 = pitem2
    
    def getKey (self):
        return self.__Key
    def getItem1 (self):
        return self.__Item1
    def getItem2 (self):
        return self.__Item2
    
    def setKey (self, pkey):
        self._Key = pkey
    def setItem1 (self, pitem1):
        self._Item1 = pitem1
    def setItem2 (self, pitem2):
        self._Item2 = pitem2

def Initalise():
    global Spare, HashTable
    for i in range (200):
        HashTable.append(NewRecord(-1,-1,-1))
    for i in range (100):
        Spare.append(NewRecord(-1,-1,-1))

def CalculateHash(key):
    returnval = key % 200
    return returnval

def InsertIntoHash(Record):
    global HashTable, Spare
    index = CalculateHash(Record.getKey())
    if HashTable[index].getKey() == -1:
        HashTable[index] = Record
    else:
       for x in range(0, 100):
            if Spare[x].getKey() == -1:
                Spare[x] = Record
                break 
    
def CreateHashTable():
    file = open ("HashData.txt", "r")

    for line in file:
        Nline = line.strip().split(",")
        record = NewRecord(int(Nline[0]), int(Nline[1]), int(Nline[2]))
        InsertIntoHash(record)
    file.close()

def PrintSpare():
    for i in range(100):
        if Spare[i].getKey() != -1:
            print(Spare[i].getKey())

Initalise()
CreateHashTable()
PrintSpare()"""

#Q3 a)

"""class Animal():
    def __init__(self, pname, psound, psize, pIntelligence):
        self._Name = pname
        self._Sound = psound
        self._Size = psize
        self._Intelligence = pIntelligence
    
    def Description(self):
        return  "The animals name is" , self._Name , ", it makes a " , self._Sound , ", its size is " , self._Size , "and its intelligence level is" , self._Intelligence

class Parrot(Animal):
    def __init__(self,  pname, psound, psize, pIntelligence, pWingSpan, pNumberWords ):
        self.__WingSpan = pWingSpan
        self.__NumberWords = pNumberWords
        Animal.__init__(self, pname, psound, psize, pIntelligence)
    
    def ChangeNumberWords(self, number):
        self.__NumberWords = self.__NumberWords + number
    
    def Description(self):
        msg = "The animal's name is ", self._Name ,", it makes a " , self._Sound ,", its size is ", self._Size ," and its intelligence level is ", self._Intelligence ,". It has a wingspan of ", self.__WingSpan ,"cm and can say ", self.__NumberWords ,"words."
        return msg

class Wolf(Animal):
    def __init__(self, pname, psound, psize, pIntelligence, pTerritorySize):
        self.__TerritorySize = pTerritorySize
        Animal.__init__(self, pname, psound, psize, pIntelligence)
    
    def SetTerritorySize(self, value):
        self.__TerritorySize = self.__TerritorySize + value
    
    def Description(self):
        msg = "The animal's name is ",self._Name , ", it makes a " ,self._Sound, ", its size is " ,self._Size, " and its intelligence level is " ,self._Intelligence, ". Its territory is " ,self.__TerritorySize, " square miles."
        return msg
    
Chewie = Parrot("Chewie", "Squawk", 1, 10, 30, 29)
Nighteyes = Wolf("Nighteyes", "Howl", 8, 7, 100)
Copper = Animal("Copper", "Neigh", 10, 6)

Nighteyes.SetTerritorySize(-20)
Chewie.ChangeNumberWords(2)

print(Chewie.Description())
print(Nighteyes.Description())
print(Copper.Description())"""