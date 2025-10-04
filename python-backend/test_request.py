import requests

url = "http://localhost:5000/analyze"
files = {"file": open(r"D:\sem 07\Software Design Competition\milestone 2\Model_Inference\test_image1\test02.jpg", "rb")}
response = requests.post(url, files=files)
print(response.json())
