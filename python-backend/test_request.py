import requests

url = "http://localhost:5000/analyze"
files = {"file": open(r"D:\sem 07\Software Design Competition\milestone 2\New folder\New folder\TX\T6\faulty\T6_faulty_001.jpg", "rb")}
response = requests.post(url, files=files)
print(response.json())

