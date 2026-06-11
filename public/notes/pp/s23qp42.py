#q1 a

#DECLARE ANIMALS ARRAY[0:10] of STRING
global Animals # array 10 elements string
Animals = []

#q1 b

Animals.append('horse')
Animals.append('lion')
Animals.append('rabbit')
Animals.append('mouse')
Animals.append('bird')
Animals.append('deer')
Animals.append('whale')
Animals.append('elephant')
Animals.append('kangaroo')
Animals.append('tiger')

#q1 c

def SortDescending():
    ArrayLength = len(Animals)
    for x in range(0, ArrayLength - 1):
        for y in range(0, ArrayLength - x - 1):
            if Animals[y][0 : 1] < Animals[y + 1][0 : 1]:
                temp = Animals[y]
                Animals[y] = Animals[y + 1]
                Animals[y + 1] = temp
SortDescending()
print(Animals)