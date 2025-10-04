import requests

url = "http://localhost:5000/analyze"
files = {"file": open(r"E:\Projects\Software Design\New folder (2)\Model_Inference(1)\Model_Inference\test_image\T1_faulty_003_overlay.png", "rb")}
response = requests.post(url, files=files)
print(response.json())

