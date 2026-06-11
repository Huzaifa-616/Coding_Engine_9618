"""#q1 a

global jobs
global NumberOfJobs
jobs = [[None, None] for i in range(100)]

#q1 b

def initialise():
    global NumberOfJobs
    NumberOfJobs = 0
    for row in range(0, 100):
        for col in range(0, 2):
            jobs[row][col] = -1

#q1 c

def AddJobs(Job_number, Priority):
    global NumberOfJobs
    global jobs
    if NumberOfJobs >= 100:
        print("Not added")
    else:
        jobs[NumberOfJobs][0] = Job_number
        jobs[NumberOfJobs][1] = Priority
        print("Added")
    
"""

#Q1
"""class EventItem():
    def __init__ (self, pEventName, pType, pDifficulty):
        self._EventName = pEventName
        self._Type = pType
        self._Difficulty = pDifficulty
    
    def GetName(self):
        return self._EventName
    
    def GetDifficulty(self):
        return self._Difficulty
    
    def GetEventType(self):
        return self._Type
    
Group = [] #array of 5 elements

Bridge = EventItem("Bridge", "jump", 3)
Water_Wade = EventItem("Water Wade", "swim", 4)
Mile_Run = EventItem("100 mile run", "run", 5)
Gridlock = EventItem("Gridlock", "drive", 2)
Wall_on_Wall = EventItem("Wall on wall", "jump", 4)

Group.append(Bridge)
Group.append(Water_Wade)
Group.append(Mile_Run)
Group.append(Gridlock)
Group.append(Wall_on_Wall)
print(Group)
class Character(EventItem):
    def __init__(self, pCharacterName, pJump, pSwim, pRun, pDrive):
        self.__CharacterName = pCharacterName
        self.__Jump = pJump
        self.__Swim = pSwim
        self.__Run = pRun
        self.__Drive = pDrive

    def GetName(self):
        return self.__CharacterName
    
    def CalculateScore(self, event, difficulty):
        global Group
        #skill level >= diff 100%
        #skill level <= diff skill - diff then calc %age
        for i in range (5):
            if Group[i].GetEventType() == event and Group[i].GetDifficulty() == difficulty:
                if self.event >= difficulty:
                    return 100
                else:
                    val = self.event - difficulty
                    if val == 1:
                        return 80
                    elif val == 2:
                        return 60
                    elif val == 3:
                        return 40
                    else:
                        return 20
    
Tarz = Character("Tarz", 5,3,5,1)
Geni = Character("Geni", 2,2,3,4)
"""
#%age cahnce compared 
#higher gets 1 point
#same so scores don't change print("Draw")




#Q2
class Queue():
    def __init__(self, pHpointer, pTpointer):
        self.QueueArray = [] #array of 100 int values
        self.__HeadPointer = pHpointer
        self.__TailPointer = pTpointer
    
    def GetHeadPointer(self):
        return self.__HeadPointer
    
    def GetTailPointer(self):
        return self.__TailPointer
    
    def GetQueueval(self, val):
        return self.QueueArray[val]
    
    def SetHpointer(self, val):
        self.__HeadPointer = val

    def SetTpointer(self, val):
        self.__TailPointer += val
    
    def SetQueue(self, val):
        self.QueueArray.append(val)

TheQueue = Queue(-1, 0)
for i in range(100):
    TheQueue.SetQueue(-1)

def Enqueue(AQueue, TheData):
    if AQueue.GetHeadPointer() == -1:
        AQueue.QueueArray[AQueue.GetTailPointer()] = TheData
        AQueue.SetHpointer(0)
        AQueue.SetTpointer(1)
        return 1
    else:
        if AQueue.GetTailPointer() > 99:
            return -1
        else:
            AQueue.QueueArray[AQueue.GetTailPointer()] = TheData
            AQueue.SetTpointer(-1)
            return 1

def ReturnAllData():
    line = ""
    for i in range(TheQueue.GetHeadPointer(), TheQueue.GetTailPointer()):
        line += str(TheQueue.GetQueueval(i)) , " "
    return line

count = 1
while count < 10:
    val = int(input("enter value >= 0: "))
    while val <= 0:
        val = int(input("enter value again: "))
    count += 1
    return_val = Enqueue(TheQueue, val)
    if return_val == -1:
        print("Queue is full")
    else:
        print("value added sucessfully")
return_line = ReturnAllData()
print(return_line)
