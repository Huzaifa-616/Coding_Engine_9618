#q3 a

NumberArray = [100, 85, 644, 22, 15, 8, 1]

#q3 b

"""def RecursiveInserton(integer_arr, Number_Elements):
    if Number_Elements <= 1:
        return integer_arr
    else:
        RecursiveInserton(integer_arr, Number_Elements - 1)
        LastItem = integer_arr[Number_Elements - 1]
        CheckItem = Number_Elements - 2
    Loop_Again = True
    if CheckItem < 0:
        Loop_Again = False
    else:
        if integer_arr[CheckItem] < LastItem:
            Loop_Again = False
    while Loop_Again:
        integer_arr[CheckItem + 1] = integer_arr[CheckItem]
        CheckItem -= 1
        if CheckItem < 0:
            Loop_Again = False
        else:
            if integer_arr[CheckItem] < LastItem:
                Loop_Again = False
    integer_arr[CheckItem + 1] = LastItem
    return integer_arr
result = RecursiveInserton(NumberArray, 7)
print("Recursive")
print(result)"""

#q3 c

'''def Recursive_Iteration(arr):


    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr
result2 = Recursive_Iteration(NumberArray)
print("Iterative")
print(result2)'''

#q3 d

"""def BinarySearch(IntegerArray, First, Last, ToFind):


    if First > Last:
        return -1
    else:
        mid = (First+Last) // 2
        if IntegerArray[mid] == ToFind:
            return mid
        elif IntegerArray[mid] < ToFind:
            return BinarySearch(IntegerArray, mid + 1, Last, ToFind)
        else:
            return BinarySearch(IntegerArray, First, mid - 1, ToFind) 
print(BinarySearch(sorted(NumberArray), 0, 6, 644))"""


#Q1 

# question 1(a)
def ReadWords(fileName):
    global WordArray
    global NumberWords
    count = 0
    with open(fileName, 'r') as file:
        line = file.readline().strip()
        while line != "":
            WordArray.append(line)
            count = count + 1
            line = file.readline().strip()
        #NumberWords = len(WordArray) - 1
        NumberWords = count - 1
    
    #question 1(d)
    Play()

# question 1(ci)
def Play():
    global WordArray
    global NumberWords
    print("Main word: ",WordArray[0])
    print("Number of words that can be made is: ", NumberWords)
    Answer = input("Enter your word or [no] to stop: ")
    correct = 0
    while Answer != "no":
        found = False
        for count in range(1, len(WordArray)):
            if Answer == WordArray[count]:
                WordArray[count] = ""
                correct += 1
                found = True
                print("Correct answer!")
                break
        if found == False:
            print("Incorrect answer")
        Answer = input("Enter your word or [no] to stop: ")
    # question 1(cii)
    print("Percentage of correct answers given: ", correct/NumberWords*100)
    for count in range(1,len(WordArray)):
        if WordArray[count] != "":
            print(WordArray[count])

# question 1(b)
global WordArray
global NumberWords
WordArray = []
NumberWords = 0

choice = input("Enter easy, medium, or hard:").lower()
match choice:
    case "easy" : file = "Easy.txt"
    case "medium" : file = "Medium.txt"
    case "hard" : file = "Hard.txt"
    case _: file = ""

if file != "":
    ReadWords(file)
else:
    print("Invalid file entered!")