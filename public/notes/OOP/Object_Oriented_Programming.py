class car:
    def __init__(self, n, e): #constructor
        self.__VID = n
        self.__Regi = ""
        self.__Dor = None               #__ means its a private variable.
        self.__ESize = e
        self.__Pprice = 0.00
    
    def SetVID(self, i):
        self.__VID = i
    
    def SetRegi(self, r):
        self.__Regi = r
    
    def SetDor(self, d):
        self.__Dor = d
    
    def SetEsize(self, e):
        self.__ESize = e
    
    def SetPprice(self, p):
        self.__Pprice = p
    
    def GetVID(self):
        return self.__VID
    
    def GetRegi(self):
        return self.__Regi

    def GetDor(self):
        return self.__Dor

    def GetESize(self):
        return self.__ESize

    def GetPprice(self):
        return self.__Pprice
    
result = car(1, 2000)
print("the vehicle id of the car is:", result.GetVID())
print(f"the engine size of the car is: {result.GetESize}")
result.SetPprice("$12000")
print(f"the price of the car is: {result.GetPprice()}")