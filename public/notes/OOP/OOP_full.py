import datetime


class Car:
    # Private Model: STRING
    # Private Make: STRING
    # Private ManufactureDate : DATE

    def __init__(self, modelP, makeP):
        self.__Model = modelP
        self.__Make = makeP
        self.__ManufactureDate = datetime.datetime(2025, 1, 1)
    
    def getMake(self):
        return self.__Make
    
    def getModel(self):
        return self.__Model
    
    def setMake(self, makeP):
        self.__Make = makeP
    
class GasolineCar(Car):
    # Private FuelCapacity : INTEGER

    def __init__(self, modelP, makeP, capacityP):
        self.__fuelCapacity = capacityP
        self.__fuel = 0
        Car.__init__(self, modelP, makeP)

    def getCapacity(self):
        return self.__fuelCapacity
    
    def refuel(self):
        self.__fuel = self.__fuel + 1

    def getFuel(self):
        return self.__fuel

class ElectricCar(Car):
    def __init__(self, modelP, makeP, batteryP):
        self.__battery = batteryP
        self.__charge = 0
        Car.__init__(self, modelP, makeP)

    def refuel(self):
        self.__charge = self.__charge + 1

    def getCharge(self):
        return self.__charge


taimoorsCar = GasolineCar("Swift", "Suzuki", "40")
print(taimoorsCar.getMake())
print(taimoorsCar.getCapacity())
print(taimoorsCar.getFuel())
taimoorsCar.refuel()
print(taimoorsCar.getFuel())

MoizCar = ElectricCar("Etron", "Audi", "7000")
print(MoizCar.getMake())
print(MoizCar.getCharge())
MoizCar.refuel()
print(MoizCar.getCharge())


'''
mycar = Car("Swift","Suzuki")
print(mycar.getMake())
print(mycar.getModel())

mycar.setMake("Honda")

print(mycar.getMake())
print(mycar.getModel())
'''