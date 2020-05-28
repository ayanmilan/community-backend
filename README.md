# community-backend

### Registeration POST route - /users/register

  ##### JSON body with fields: mobileNo
  Eg - 
  
      {
        "mobileNo": 9999999999
      }
  
### OTP Registeration POST route - /users/register/otp
  
  ##### JSON body with fields: mobileNo, password, otp
  Eg - 
  
      {
        "mobileNo": 9999999999,
        "password": "test123",
        "otp": "1234"
      }
  
### Login POST route - /users/login
 
  ##### JSON body with fields: mobileNo, password
  Eg - 
  
    {
      "mobileNo": 9999999999,
      "password": "test123"
    } 
