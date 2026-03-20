/**
 * Success Unsubscribe HTML view template
 */
const getUnsubscribeSuccessView = (email) => {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hủy đăng ký thành công</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family: system-ui, -apple-system, Arial; }
  body { height:100vh; display:flex; align-items:center; justify:center; background: linear-gradient(135deg,#667eea,#764ba2); margin:0; display:flex; align-items:center; justify-content:center; }
  .card { background:white; padding:50px; border-radius:16px; text-align:center; max-width:420px; box-shadow:0 20px 40px rgba(0,0,0,0.15); }
  .icon { font-size:70px; margin-bottom:15px; }
  h2 { font-size:26px; margin-bottom:10px; color:#222; }
  p { color:#555; line-height:1.6; }
  .email { font-weight:600; color:#111; }
  .btn { display:inline-block; margin-top:25px; padding:12px 24px; background:#667eea; color:white; text-decoration:none; border-radius:8px; font-weight:600; transition:0.2s; }
  .btn:hover { background:#5a67d8; }
</style>
</head>
<body>
<div class="card">
  <div class="icon">✅</div>
  <h2>Bạn đã hủy đăng ký</h2>
  <p>Email <span class="email">${email}</span><br>sẽ không nhận email marketing từ PetNest nữa.</p>
  <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:3000'}/homepage">Quay lại trang chủ</a>
</div>
</body>
</html>
`;
};

module.exports = { getUnsubscribeSuccessView };
