"""#Q1 a
import random
Stack = [-1 for i in range (30)]   #array of 30 elements
TopOfStack = -1                    #vatiable of type integer

#Q1 b
def Push(item):
    global TopOfStack
    if TopOfStack == 29:
        return False
    else:
        TopOfStack += 1
        Stack[TopOfStack] = item
    return True

def pop():
    global TopOfStack
    if TopOfStack == -1:
        return -999
    else:
        val = Stack[TopOfStack]
        Stack[TopOfStack] = -1
        TopOfStack -= 1
    return val

for i in range(40):
    val = random.randint(0,1000)
    flag = Push(val)
    if flag == False:
        break

def FindValues():
    global TopOfStack
    nlist = []
    flagval = 0
    while flagval != -999:
        flagval = pop()
        nlist.append(flagval)
    nlist = sorted(nlist)
    print(nlist)

    print(f"the largest value in the stack is: {nlist[len(nlist)-1]}")
    print(f"the smallest value in the stack is: {nlist[1]}")

FindValues()

#Q2

class Train:
    def __init__(self, ptrainidnumber, proute):
        self.__TrainIDNumber = ptrainidnumber #DECLARE TRAINIDNUMBER: STRING
        self.__Route = proute                 #DECLARE ROUTE: INTEGER
    
    def GetTrainIDNumber (self):
        return self.__TrainIDNumber
    def GetRoute (self):
        return self.__Route
    
Train1 = Train("12ADV", 134)
Train2 = Train("33ART", 20)
Train3 = Train("9FKF", 3)
Train4 = Train("21VBC", 24)

class Station():
    def __init__(self ,pstationid, pplatforms):
        self.__StationID = pstationid
        self.__NumberPlatforms = pplatforms
        self.__Trains = []
        self.__NumberTrains = 0

    def AddTrain (self, pTrain):
        if self.__NumberPlatforms <= self.__NumberTrains:
            return False
        else:
            self.__Trains.append(pTrain)
            self.__NumberTrains += 1
            return True

    def GetTrains (self):
        if self.__NumberTrains == 0:
            rstring = "There are no Trains"
            return rstring
        else:
            r1string = f"the trains at the station {self.__StationID} are: \n"
            for i in range(0, self.__NumberTrains):
                r2string = f"{self.__Trains[i].GetTrainIDNumber()} on the route number {self.__Trains[i].GetRoute()} \n"
                outputstr = r1string + r2string
        return outputstr

Station1 = Station("STH", 2)
Station2 = Station("NTH", 1)

val = Station.AddTrain(Station1, Train1)
if val == False:
    print("Station is full")
val = Station.AddTrain(Station1, Train2)
if val == False:
    print("Station is full")
val = Station.AddTrain(Station1, Train3)
if val == False:
    print("Station is full")
val =Station.AddTrain(Station2, Train4)
if val == False:
    print("Station is full")

print(Station1.GetTrains())
print(Station2.GetTrains())"""

class Record:
    def __init__(self, pkey, pdata):
        self.Key = pkey    #declare key integer
        self.Data = pdata  #decalre data string

HashTable = [] #2d array of 100x10 elements
def IntialiseHashTable():
    global HashTable
    HashTable = [[Record(-1,"")]*10 for i in range(100)]

def Hash(pkey):
    HashVal = pkey % 10
    return HashVal

def InsertData(precord):
    global HashTable
    HashVal = Hash(precord.Key)
    for j in range(10):
                if HashTable[HashVal][j].Key == -1:
                    HashTable[HashVal][j] = precord

def ReadData():
    global HashTable
    try:
        global HashTable
        File = open("HashTableData.txt")
        for Line in File:
            Data = Line.strip()
            Data = Line.split(",")
            InsertData(Record(int(Data[0]), Data[1]))
        File.close()
    except IOError:
        print("file not found")
    
def GetRecord(pkey):
    global HashTable
    Hashval = Hash(pkey)
    for j in range(10):
        if HashTable[Hashval][j].Key == pkey:
            return HashTable[Hashval][j].Data
    return ("not found")

IntialiseHashTable()
for i in range(5):
    val = int(input("enter keyfield"))
    output = GetRecord(val)
    print(output)

