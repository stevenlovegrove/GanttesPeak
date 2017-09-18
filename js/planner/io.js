//////////////////////////////////////////////////////////////////////////////
// LocalStorage
//////////////////////////////////////////////////////////////////////////////

function LoadFromLocalStorage() {
    if (localStorage) {
        let json = localStorage.getObject("ghe.oculus.com.project");
        if(json) {
            LoadFromProjectJson(json, "LocalStorage");
        }
    }
}

function SaveToLocalStorage() {
    if (localStorage) {
        project_json = SaveToProjectJson();
        localStorage.setObject("ghe.oculus.com.project", project_json);
    }
}

//////////////////////////////////////////////////////////////////////////////
// ReadFile
//////////////////////////////////////////////////////////////////////////////

function ResetPlanner()
{
    if(root_project_task) {
        // Delete existing elements
        $('#chart').remove("svg");
        $('#dates').remove("svg");
        root_project_task = null;
    }
}

function InitialiseProject()
{
    if(!root_project_task) {
        root_project_task = CreateProject();
        ComputeSchedule();
    }
}

function LoadFromFile(input) {
  let fullPath = input.value;
  let filename = fullPath.split(/(\\|\/)/g).pop();

  if (typeof window.FileReader !== 'function' || !input || !input.files) {
    alert("The file API isn't supported on this browser yet.");
    return;
  }

  if (!input.files[0]) {
    // Cancelled
  } else {
    let file = input.files[0];
    let fr = new FileReader();

    fr.onload = function(e) {
      let file_contents = e.target.result;
      let json = null;
      if(filename.toUpperCase().endsWith('XML')) {
          json = ProjectJsonFromXml(file_contents);
      }else{
          json = JSON.parse(file_contents);
      }
      LoadFromProjectJson(json, filename);
    };

    fr.readAsText(file);
  }
}

function SaveFile()
{
    let json = SerializeProject(root_project_task);
    let prj_str = JSON.stringify(json, null, 2);
    let filename = root_project_task.children[0].name;
    saveAs(new Blob([prj_str],{type: "text/plain;charset=utf-8"}), filename)
}

//////////////////////////////////////////////////////////////////////////////
// Parse Project JSON
//////////////////////////////////////////////////////////////////////////////

function LoadFromProjectJson(json, filename)
{
    AddFileJsonToProject(filename, json);
    ComputeSchedule();
}

function NewUid()
{
    return 'task_' + Math.floor((1 + Math.random()) * 0x100000000000).toString();
}

function CreateProject()
{
    // Create root task with augmented properties
    let project = new Task( NewUid(), 'Planner');
    project.uid_map = {};
    project.uid_map[project.uid] = project
    project.edges = [];

    // Add default child project
    let new_file = new Task( NewUid(), 'untitled.json', '', 1)
    // new_task.is_anchor = (t.startIsMilestone || t.endIsMilestone);
    // new_task.duration_days = t.duration;
    // new_task.started_date = new_task.is_anchor ? t.start : null;
    // new_task.lazy = t.lazy == null ? false : t.lazy;
    // new_task.depends = t.depends;

    project.AddChild(new_file);
    project.uid_map[new_file.uid] = new_file

    return project;
}

function AddFileJsonToProject(filename, json)
{
	let tasklist = json['tasks'];

    // New child of root_project_task for file.
    let filetask = new Task(filename, filename, '');
    root_project_task.AddChild(filetask);
    root_project_task.uid_map[filename] = filetask;
	let stack = [filetask];

	// Create tasks: Depth-first traversal.
	for(let i=0; i < tasklist.length; ++i)
	{
		let t = tasklist[i];
		let p = stack[stack.length-1];
		let new_task = new Task(t.id, t.name, t.description);

        new_task.is_anchor = (t.startIsMilestone || t.endIsMilestone);
        new_task.duration_days = t.duration;
        new_task.started_date = new_task.is_anchor ? t.start : null;
        new_task.lazy = t.lazy == null ? false : t.lazy;
        new_task.depends = t.depends;

		p.AddChild(new_task);
		root_project_task.uid_map[t.id] = new_task;

		// If we're not the last task
		if(i < tasklist.length-1) {
            // Indentation of the next element wrt this one.
            let indent = tasklist[i+1].level - t.level;

            if(indent == 1) {
                stack.push(new_task);
            }

            // Undent until we're at the correct level
            while(indent < 0) {
                stack.pop();
                indent ++;
            }
		}
	}

    ComputeSchedule();

    if(NewFileLoadedCallback) {
        NewFileLoadedCallback();
    }
}

function SerializeTask(task, json_tasks, outlinelevel)
{
    // add task to json_tasks
    json_tasks.push(
      {
        "id": task.uid,
        "name": task.name,
        "description": task.notes,
        "level": outlinelevel,
        "status": "STATUS_ACTIVE",
        "depends": task.depends,
        "canWrite": true,
        "start": task._start_ms,
        "duration": task.duration_days,
        "end": task._end_ms,
        "startIsMilestone": task.is_anchor,
        "endIsMilestone": false,
        "collapsed": false,
        "assigs": [],
        "lazy":task.is_lazy
      }
    );

    // add children
    for(let c=0; c < task.children.length; ++c) {
        SerializeTask(task.children[c], json_tasks, outlinelevel+1);
    }
}

function SerializeProject(project)
{
    let json_tasks = [];
    let json_resources = [];
    let json_roles = [];
    let json_project = {
      "tasks" : json_tasks,
      "resources": json_resources,
      "roles": json_roles,
    };

    // Serialise first file for now.
    for(let c=0; c < project.children[0].children.length; ++c) {
        SerializeTask(project.children[0].children[c], json_tasks, 1);
    }

    return json_project;
}

//////////////////////////////////////////////////////////////////////////////
// XML Import
//////////////////////////////////////////////////////////////////////////////

function ProjectJsonFromXml(str_xml)
{
  let parser = new DOMParser();
  let xmlDoc = parser.parseFromString(str_xml,"text/xml");
  let xmlTasks = xmlDoc.getElementsByTagName('Task');
  let tasks = [];

  $(xmlDoc).find('Tasks').children('Task').each(function()
  {
    let self = $(this);
    let GetAttr = function(name,val='') {
      let children = self.children(name);
      if( children && children.length > 0) {
        return children[0].innerHTML;
      }else{
        return val;
      }
    }

    if(GetAttr('ID').length > 0 && GetAttr('Name').length > 0) {
      let id = GetAttr('ID');
      let name = GetAttr('Name');
      let notes = GetAttr('Notes');
      let start = Date.parse(GetAttr('Start'));
      let finish = Date.parse(GetAttr('Finish'));
      let duration = GetAttr('Duration','PT24H0M0S');
      let outlinenum = GetAttr('OutlineNumber');
      let outlinelevel = parseInt(GetAttr('OutlineLevel','0'), 10);

      // The xml only fills the hours field.
      let xsdurationRegEx = /(-?)P((\d{1,4})Y)?((\d{1,4})M)?((\d{1,4})D)?(T((\d{1,4})H)?((\d{1,4})M)?((\d{1,4}(\.\d{1,3})?)S)?)?/;
      let match = duration.match(xsdurationRegEx);
      let hours = match[10] ? match[10] : 0;

      let depends_uids = [];

      self.children('PredecessorLink').children('PredecessorUID').each(function() {
        let preduid = $(this)[0].innerHTML;
        depends_uids.push(preduid);
      });

      tasks.push(
        {
          "id": id,
          "name": name,
          "progress": 0,
          "progressByWorklog": false,
          "relevance": 0,
          "type": "",
          "typeId": "",
          "description": notes,
          "code": "",
          "level": outlinelevel,
          "status": "STATUS_ACTIVE",
          "depends": depends_uids,
          "canWrite": true,
          "start": start,
          "duration": parseInt(hours) / 8,
          "end": finish,
          "startIsMilestone": false,
          "endIsMilestone": false,
          "collapsed": false,
          "assigs": [],
          "hasChild": false
        }
      );
    }
  });

  let resources = [];
  let roles = [];
  let project = {
    "tasks" : tasks,
    "resources": resources,
    "roles": roles,
    "selectedRow": 0,
    "deletedTaskIds": [],
    "canWrite": true,
    "canWriteOnParent": true,
    "zoom": "m"
  };
  return project;
}
