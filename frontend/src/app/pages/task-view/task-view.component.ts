import { Component, OnInit } from '@angular/core';
import {TaskService} from '../../task.service';


@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent {

  constructor(private taskService: TaskService) { }


  createNewList(){
    this.taskService.createList('testing').subscribe((response:any)=>{
      console.log(response);
    });

  }
}
