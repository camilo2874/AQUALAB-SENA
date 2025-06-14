import React, { useState } from "react";
import { TextField, Box } from "@mui/material";
import CustomButton from "./CustomButton";

const CustomForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Nombre"
        name="name"
        variant="outlined"
        fullWidth
        onChange={handleChange}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#39A900" }, 
            "&:hover fieldset": { borderColor: "#2E7D00" },
          },
        }}
      />
      <TextField
        label="Correo Electrónico"
        name="email"
        type="email"
        variant="outlined"
        fullWidth
        onChange={handleChange}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#39A900" },
            "&:hover fieldset": { borderColor: "#2E7D00" },
          },
        }}
      />
      <CustomButton text="Enviar" color="primary" />
    </Box>
  );
};

export default CustomForm;
