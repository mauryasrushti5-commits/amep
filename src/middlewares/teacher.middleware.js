const teacherOnly = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Teacher access only"
    });
  }
  next();
};

export default teacherOnly;
