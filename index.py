import pyautogui

# def on_move(x, y):
#     print("Mouse moved to ({0}, {1})".format(x, y))

# def on_click(x, y, button, pressed):
#     if pressed:
#         print('Mouse clicked at ({0}, {1}) with {2}'.format(x, y, button))
#     else:
#         print('Mouse released at ({0}, {1}) with {2}'.format(x, y, button))

# def on_scroll(x, y, dx, dy):
#     print('Mouse scrolled at ({0}, {1})({2}, {3})'.format(x, y, dx, dy))

# Use pyautogui to check for mouse events
while True:
    # x, y = pyautogui.position()
    button = pyautogui.mouseInfo()
    # pressed = pyautogui.mouseDown()
    
    # if pressed:
    #     on_click(x, y, button, True)
    # else:
    #     on_click(x, y, button, False)
    
    pyautogui.PAUSE = 0.1  # Add a small delay to avoid high CPU usage
