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
  
### Login with password POST route - /users/loginpw
 
  ##### JSON body with fields: mobileNo, password
  Eg - 
  
    {
      "mobileNo": 9999999999,
      "password": "test123"
    }
    
### Login with OTP POST route - /users/loginotp
 
  ##### JSON body with fields: mobileNo
  Eg - 
  
    {
      "mobileNo": 9999999999
    }
    
### Login OTP verification POST route - /users/loginotp/verify
 
  ##### JSON body with fields: mobileNo, otp
  Eg - 
  
    {
      "mobileNo": 9999999999,
      "otp": "1234"
    }    
