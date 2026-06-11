#q1 a

"""global Jobs
global NumberOfJobs
Jobs = []

def Initalise():
    global NumberOfJobs
    NumberOfJobs = 0
    for j in range(0, 100):
        Jobs.append([-1, -1])

#q1 c

def AddJob(jobnumber, priority):
    global NumberOfJobs
    if NumberOfJobs <= 99:
        Jobs[NumberOfJobs][0] = jobnumber
        Jobs[NumberOfJobs][1] = priority
        print("Added")
        NumberOfJobs += 1
    else:
        print("Not added")

#q1 d

Initalise()
AddJob(12,10)
AddJob(526,9)
AddJob(33,8)
AddJob(12,9)
AddJob(78,1)

#q1 e

def InsertionSort():
    for i in range(0, 100):
        key = Jobs[i]
        j = i - 1
        while j >= 0 and Jobs[j][1] > key[1]:
            Jobs[j + 1] = Jobs[j]
            j -= 1
        Jobs[j + 1] = key


#q1 f

def PrintArray():
    for i in range(0 ,100):
        job = Jobs[i][0]
        priority = Jobs[i][1]
        if job != -1:
            print(job, "priority",priority )

#q1 g
InsertionSort()
PrintArray()"""
#-----------------------------------------------------
#q3 a
global Queue
global headpointer
global tailpointer
Queue = [None for i in range(100)]
headpointer = -1
tailpointer = -1

#q3 b

def Enqueue(val):
    global headpointer, tailpointer
    if tailpointer == len(Queue):
        return False
    else:
        if tailpointer == -1:
            tailpointer = 0
            headpointer = 0
        else:
            tailpointer += 1
        Queue[tailpointer] = val
        return True

#q3 c

for i in range(1, 21):
    result = Enqueue(i)
    if result == True:
        print("Successful")
    else:
        print("Unsuccessful")

#q3 d

def IterativeOutput(Start):
    if Start > tailpointer:
        return 0
    else:
        Total = Queue[Start] + IterativeOutput(Start + 1)
    return Total
print(IterativeOutput(0)) 