class TreasureChest:
    # Private question : String
    # Private asnwer : Integer
    # Private points : Integer

    def __init__(self, questionP, answerP, pointsP):
        self.__question = questionP
        self.__answer = answerP
        self.__points = pointsP
    
    #part i)
    def getQuestion(self):
        return self.__question
    
    #part ii)
    def checkAnswer(self, answerP):
        if int(self.__answer) == answerP:
            return True
        else:
            return False
    #part iii)
    def getPoints(self, attempts):
        if attempts == 1:
            return self.__points
        elif attempts == 2:
            return self.__points // 2
        elif attempts == 3 or attempts == 4:
            return self.__points // 4
        else:
            return 0
        
    #part b)
    def readData():
        global arrayTreasure
        filename = "TreasureChestData.txt"
        try:
            file = open(filename, "r")
            data = (file.readline()).strip()
            while data != "":
                Question = data
                answer = (file.readline).strip
                points = (file.readline).strip
                arrayTreasure = (TreasureChest(Question, answer, points))
                Question = (file.readline).strip
            file.close()
        except IOError:
            print("file not found")

    #part c) IV)
    count = 0
    readData()
    question = int(input("enter question no. between 1 and 5: "))
    print(arrayTreasure[question[1]])
    checkAnswer(arrayTreasure[question[2]])
    while checkAnswer(arrayTreasure[question[2]]) != True:
        print(arrayTreasure[question[1]])
        checkAnswer(arrayTreasure[question[2]])
        count = count + 1
    pointsAwared = getPoints(count)
    print(pointsAwared)
