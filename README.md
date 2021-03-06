# community-backend

### Registeration POST route - /users/register

  ##### JSON body with fields: mobileNo
  Eg - 
  
      {
        "mobileNo": "9999999999"
      }
  
### OTP Registeration POST route - /users/register/verify
  
  ##### JSON body with fields: mobileNo, password, otp, name, dob(YYYY-MM-DD)
  Eg - 
  
      {
        "mobileNo": "9999999999",
        "password": "test123",
        "otp": "1234",
        "name": "test name",
        "dob": "1990-10-24"
      }
  
### Login with password POST route - /users/loginpw
 
  ##### JSON body with fields: mobileNo, password
  Eg - 
  
    {
      "mobileNo": "9999999999",
      "password": "test123"
    }
    
### Login with OTP POST route - /users/loginotp
 
  ##### JSON body with fields: mobileNo
  Eg - 
  
    {
      "mobileNo": "9999999999"
    }
    
### Login OTP verification POST route - /users/loginotp/verify
 
  ##### JSON body with fields: mobileNo, otp
  Eg - 
  
    {
      "mobileNo": "9999999999",
      "otp": "1234"
    }    

### Forgot password POST route (requires OTP from 'Login with OTP route') - /users/forgotpw
 
  ##### JSON body with fields: mobileNo, otp, password
  Eg - 
  
    {
      "mobileNo": "9999999999",
      "otp": "1234",
      "password": "newpass"
    }    