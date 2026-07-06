package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Task struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

var tasks = []Task{
	{
		ID:    1,
		Title: "Estudar Go",
		Done:  false,
	},
	{
		ID:    2,
		Title: "Publicar projeto no GitHub",
		Done:  true,
	},
}

func main() {

	r := chi.NewRouter()

	r.Get("/tasks", getTasks)

	fmt.Println("Servidor iniciado na porta 8080")

	http.ListenAndServe(":8080", r)
}

func getTasks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	w.Header().Set("Content-Type", "application/json")

	encoder := json.NewEncoder(w)
	encoder.SetIndent("", "    ")
	encoder.Encode(tasks)
}
