
def factorial(num):
    global answer
    if num == 0:
        answer =  1
    else:
        answer =  num * factorial(num - 1)
    return answer
result = factorial(5)
print(result)