import requests

url = "http://localhost:5000/analyze"
files = {"file": open(r"D:\sem 07\Software Design Competition\milestone 2\New folder\New folder\TX\T7\faulty\T7_faulty_003.jpg", "rb")}
response = requests.post(url, files=files)
print(response.json())
